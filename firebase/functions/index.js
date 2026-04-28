const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

const db = admin.firestore();

exports.registerCreator = functions.https.onCall(async (data, context) => {
    const { name, email, website } = data;
    
    if (!name || !email) {
        throw new functions.https.HttpsError('invalid-argument', 'Name and email are required');
    }
    
    const creatorId = crypto.randomUUID();
    const creatorKey = crypto.randomBytes(32).toString('base64');
    
    await db.collection('creators').doc(creatorId).set({
        name,
        email,
        website: website || '',
        creatorKey,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'active'
    });
    
    return {
        creatorId,
        creatorKey,
        message: 'Creator registered successfully'
    };
});

exports.registerCard = functions.https.onCall(async (data, context) => {
    const { creatorId, creatorKey, cardName, encryptedData, iv, tag } = data;
    
    if (!creatorId || !creatorKey || !cardName || !encryptedData) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    const creatorDoc = await db.collection('creators').doc(creatorId).get();
    if (!creatorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Creator not found');
    }
    
    const creatorData = creatorDoc.data();
    if (creatorData.creatorKey !== creatorKey) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid creator key');
    }
    
    if (creatorData.status !== 'active') {
        throw new functions.https.HttpsError('permission-denied', 'Creator account is suspended');
    }
    
    const cardId = crypto.randomUUID();
    
    await db.collection('cards').doc(cardId).set({
        creatorId,
        cardName,
        encryptedData,
        iv: iv || '',
        tag: tag || '',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        usageCount: 0
    });
    
    return {
        cardId,
        message: 'Card registered successfully'
    };
});

exports.requestOneTimeKey = functions.https.onCall(async (data, context) => {
    const { cardId, creatorId, userId } = data;
    
    if (!cardId || !creatorId || !userId) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    const cardDoc = await db.collection('cards').doc(cardId).get();
    if (!cardDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Card not found');
    }
    
    const cardData = cardDoc.data();
    if (cardData.creatorId !== creatorId) {
        throw new functions.https.HttpsError('permission-denied', 'Card does not belong to this creator');
    }
    
    const oneTimeKey = crypto.randomBytes(32).toString('base64');
    const usageId = crypto.randomUUID();
    const expiresAt = Date.now() + 30 * 60 * 1000;
    
    await db.collection('usageLogs').doc(usageId).set({
        cardId,
        creatorId,
        userId,
        oneTimeKey,
        usedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        expiresAt
    });
    
    return {
        oneTimeKey,
        usageId,
        expiresAt
    };
});

exports.confirmCardImport = functions.https.onCall(async (data, context) => {
    const { usageId } = data;
    
    if (!usageId) {
        throw new functions.https.HttpsError('invalid-argument', 'UsageId is required');
    }
    
    const usageDoc = await db.collection('usageLogs').doc(usageId).get();
    if (!usageDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Usage log not found');
    }
    
    const usageData = usageDoc.data();
    
    if (usageData.expiresAt && Date.now() > usageData.expiresAt.toMillis()) {
        await db.collection('usageLogs').doc(usageId).update({
            status: 'expired'
        });
        throw new functions.https.HttpsError('deadline-exceeded', 'One-time key has expired');
    }
    
    await db.collection('usageLogs').doc(usageId).update({
        status: 'confirmed',
        confirmedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await db.collection('cards').doc(usageData.cardId).update({
        usageCount: admin.firestore.FieldValue.increment(1)
    });
    
    return {
        message: 'Import confirmed successfully'
    };
});

exports.getUsageLogs = functions.https.onCall(async (data, context) => {
    const { creatorId, creatorKey } = data;
    
    if (!creatorId || !creatorKey) {
        throw new functions.https.HttpsError('invalid-argument', 'CreatorId and creatorKey are required');
    }
    
    const creatorDoc = await db.collection('creators').doc(creatorId).get();
    if (!creatorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Creator not found');
    }
    
    const creatorData = creatorDoc.data();
    if (creatorData.creatorKey !== creatorKey) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid creator key');
    }
    
    const snapshot = await db.collection('usageLogs')
        .where('creatorId', '==', creatorId)
        .orderBy('usedAt', 'desc')
        .limit(100)
        .get();
    
    const logs = [];
    snapshot.forEach(doc => {
        const logData = doc.data();
        logs.push({
            usageId: doc.id,
            cardId: logData.cardId,
            userId: logData.userId,
            status: logData.status,
            usedAt: logData.usedAt ? logData.usedAt.toMillis() : null,
            confirmedAt: logData.confirmedAt ? logData.confirmedAt.toMillis() : null
        });
    });
    
    return {
        logs,
        total: logs.length
    };
});

exports.getCreatorCards = functions.https.onCall(async (data, context) => {
    const { creatorId, creatorKey } = data;
    
    if (!creatorId || !creatorKey) {
        throw new functions.https.HttpsError('invalid-argument', 'CreatorId and creatorKey are required');
    }
    
    const creatorDoc = await db.collection('creators').doc(creatorId).get();
    if (!creatorDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Creator not found');
    }
    
    const creatorData = creatorDoc.data();
    if (creatorData.creatorKey !== creatorKey) {
        throw new functions.https.HttpsError('permission-denied', 'Invalid creator key');
    }
    
    const snapshot = await db.collection('cards')
        .where('creatorId', '==', creatorId)
        .orderBy('createdAt', 'desc')
        .get();
    
    const cards = [];
    snapshot.forEach(doc => {
        const cardData = doc.data();
        cards.push({
            cardId: doc.id,
            cardName: cardData.cardName,
            createdAt: cardData.createdAt ? cardData.createdAt.toMillis() : null,
            usageCount: cardData.usageCount || 0
        });
    });
    
    return {
        cards,
        total: cards.length
    };
});

exports.healthCheck = functions.https.onRequest((req, res) => {
    res.status(200).json({ status: 'ok', timestamp: Date.now() });
});

exports.requestKey = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { cardId, creatorId, userId } = req.body;
        
        if (!cardId || !creatorId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const cardDoc = await db.collection('cards').doc(cardId).get();
        if (!cardDoc.exists) {
            return res.status(404).json({ error: 'Card not found' });
        }
        
        const cardData = cardDoc.data();
        if (cardData.creatorId !== creatorId) {
            return res.status(403).json({ error: 'Card does not belong to this creator' });
        }
        
        const oneTimeKey = crypto.randomBytes(32).toString('base64');
        const usageId = crypto.randomUUID();
        const expiresAt = Date.now() + 30 * 60 * 1000;
        
        await db.collection('usageLogs').doc(usageId).set({
            cardId,
            creatorId,
            userId,
            oneTimeKey,
            usedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            expiresAt
        });
        
        res.status(200).json({
            oneTimeKey,
            usageId,
            expiresAt
        });
    } catch (e) {
        console.error('requestKey error:', e);
        res.status(500).json({ error: e.message });
    }
});

exports.confirmImport = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { usageId } = req.body;
        
        if (!usageId) {
            return res.status(400).json({ error: 'UsageId is required' });
        }
        
        const usageDoc = await db.collection('usageLogs').doc(usageId).get();
        if (!usageDoc.exists) {
            return res.status(404).json({ error: 'Usage log not found' });
        }
        
        const usageData = usageDoc.data();
        
        if (usageData.expiresAt && Date.now() > usageData.expiresAt.toMillis()) {
            await db.collection('usageLogs').doc(usageId).update({
                status: 'expired'
            });
            return res.status(410).json({ error: 'One-time key has expired' });
        }
        
        await db.collection('usageLogs').doc(usageId).update({
            status: 'confirmed',
            confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('cards').doc(usageData.cardId).update({
            usageCount: admin.firestore.FieldValue.increment(1)
        });
        
        res.status(200).json({ message: 'Import confirmed successfully' });
    } catch (e) {
        console.error('confirmImport error:', e);
        res.status(500).json({ error: e.message });
    }
});