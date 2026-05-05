export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            if (path === '/api/health') {
                return jsonResponse({ status: 'ok', timestamp: Date.now() }, corsHeaders);
            }

            if (path === '/api/register' && request.method === 'POST') {
                return handleRegister(request, env, corsHeaders);
            }

            if (path === '/api/cards') {
                if (request.method === 'GET') {
                    return handleGetCards(request, env, corsHeaders);
                }
                if (request.method === 'POST') {
                    return handleRegisterCard(request, env, corsHeaders);
                }
            }

            if (path.startsWith('/api/cards/') && request.method === 'DELETE') {
                const cardId = path.replace('/api/cards/', '');
                return handleDeleteCard(request, env, cardId, corsHeaders);
            }

            if (path === '/api/requestKey' && request.method === 'POST') {
                return handleRequestKey(request, env, corsHeaders);
            }

            if (path === '/api/confirmImport' && request.method === 'POST') {
                return handleConfirmImport(request, env, corsHeaders);
            }

            if (path === '/api/logs' && request.method === 'GET') {
                return handleGetLogs(request, env, corsHeaders);
            }

            return jsonResponse({ error: 'Not found' }, corsHeaders, 404);
        } catch (e) {
            console.error('Worker error:', e);
            return jsonResponse({ error: e.message }, corsHeaders, 500);
        }
    }
};

function jsonResponse(data, headers, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers
    });
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function generateKey() {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
        bytes[i] = Math.floor(Math.random() * 256);
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function handleRegister(request, env, corsHeaders) {
    const body = await request.json();
    const { name, email, website } = body;

    if (!name || !email) {
        return jsonResponse({ error: 'Name and email are required' }, corsHeaders, 400);
    }

    const creatorId = generateUUID();
    const creatorKey = generateKey();

    await env.CARD_KV.put(`creator:${creatorId}`, JSON.stringify({
        creatorId,
        name,
        email,
        website: website || '',
        creatorKey,
        createdAt: Date.now(),
        status: 'active'
    }));

    return jsonResponse({
        creatorId,
        creatorKey,
        message: 'Creator registered successfully'
    }, corsHeaders);
}

async function handleRegisterCard(request, env, corsHeaders) {
    const body = await request.json();
    const { creatorId, creatorKey, cardName, encryptedData, iv, tag } = body;

    if (!creatorId || !creatorKey || !cardName || !encryptedData) {
        return jsonResponse({ error: 'Missing required fields' }, corsHeaders, 400);
    }

    const creatorDataRaw = await env.CARD_KV.get(`creator:${creatorId}`);
    if (!creatorDataRaw) {
        return jsonResponse({ error: 'Creator not found' }, corsHeaders, 404);
    }

    const creatorData = JSON.parse(creatorDataRaw);
    if (creatorData.creatorKey !== creatorKey) {
        return jsonResponse({ error: 'Invalid creator key' }, corsHeaders, 403);
    }

    if (creatorData.status !== 'active') {
        return jsonResponse({ error: 'Creator account is suspended' }, corsHeaders, 403);
    }

    const cardId = generateUUID();

    await env.CARD_KV.put(`card:${cardId}`, JSON.stringify({
        cardId,
        creatorId,
        cardName,
        encryptedData,
        iv: iv || '',
        tag: tag || '',
        createdAt: Date.now(),
        usageCount: 0
    }));

    const cardsListRaw = await env.CARD_KV.get(`cards:${creatorId}`);
    const cardsList = cardsListRaw ? JSON.parse(cardsListRaw) : [];
    cardsList.push(cardId);
    await env.CARD_KV.put(`cards:${creatorId}`, JSON.stringify(cardsList));

    return jsonResponse({
        cardId,
        message: 'Card registered successfully'
    }, corsHeaders);
}

async function handleGetCards(request, env, corsHeaders) {
    const url = new URL(request.url);
    const creatorId = url.searchParams.get('creatorId');
    const creatorKey = url.searchParams.get('creatorKey');

    if (!creatorId || !creatorKey) {
        return jsonResponse({ error: 'CreatorId and creatorKey are required' }, corsHeaders, 400);
    }

    const creatorDataRaw = await env.CARD_KV.get(`creator:${creatorId}`);
    if (!creatorDataRaw) {
        return jsonResponse({ error: 'Creator not found' }, corsHeaders, 404);
    }

    const creatorData = JSON.parse(creatorDataRaw);
    if (creatorData.creatorKey !== creatorKey) {
        return jsonResponse({ error: 'Invalid creator key' }, corsHeaders, 403);
    }

    const cardsListRaw = await env.CARD_KV.get(`cards:${creatorId}`);
    const cardsList = cardsListRaw ? JSON.parse(cardsListRaw) : [];

    const cards = [];
    for (const cardId of cardsList) {
        const cardDataRaw = await env.CARD_KV.get(`card:${cardId}`);
        if (cardDataRaw) {
            const cardData = JSON.parse(cardDataRaw);
            cards.push({
                cardId: cardData.cardId,
                cardName: cardData.cardName,
                createdAt: cardData.createdAt,
                usageCount: cardData.usageCount || 0,
                encryptedData: cardData.encryptedData,
                iv: cardData.iv,
                tag: cardData.tag
            });
        }
    }

    cards.sort((a, b) => b.createdAt - a.createdAt);

    return jsonResponse({
        cards,
        total: cards.length
    }, corsHeaders);
}

async function handleDeleteCard(request, env, corsHeaders) {
    const body = await request.json();
    const { creatorId, creatorKey } = body;
    const cardId = request.url.pathname.replace('/api/cards/', '');

    if (!creatorId || !creatorKey) {
        return jsonResponse({ error: 'CreatorId and creatorKey are required' }, corsHeaders, 400);
    }

    const creatorDataRaw = await env.CARD_KV.get(`creator:${creatorId}`);
    if (!creatorDataRaw) {
        return jsonResponse({ error: 'Creator not found' }, corsHeaders, 404);
    }

    const creatorData = JSON.parse(creatorDataRaw);
    if (creatorData.creatorKey !== creatorKey) {
        return jsonResponse({ error: 'Invalid creator key' }, corsHeaders, 403);
    }

    const cardDataRaw = await env.CARD_KV.get(`card:${cardId}`);
    if (!cardDataRaw) {
        return jsonResponse({ error: 'Card not found' }, corsHeaders, 404);
    }

    const cardData = JSON.parse(cardDataRaw);
    if (cardData.creatorId !== creatorId) {
        return jsonResponse({ error: 'Card does not belong to this creator' }, corsHeaders, 403);
    }

    await env.CARD_KV.delete(`card:${cardId}`);

    const cardsListRaw = await env.CARD_KV.get(`cards:${creatorId}`);
    if (cardsListRaw) {
        const cardsList = JSON.parse(cardsListRaw);
        const newList = cardsList.filter(id => id !== cardId);
        await env.CARD_KV.put(`cards:${creatorId}`, JSON.stringify(newList));
    }

    return jsonResponse({
        message: 'Card deleted successfully'
    }, corsHeaders);
}

async function handleRequestKey(request, env, corsHeaders) {
    const body = await request.json();
    const { cardId, creatorId, userId } = body;

    if (!cardId || !creatorId || !userId) {
        return jsonResponse({ error: 'Missing required fields' }, corsHeaders, 400);
    }

    const cardDataRaw = await env.CARD_KV.get(`card:${cardId}`);
    if (!cardDataRaw) {
        return jsonResponse({ error: 'Card not found' }, corsHeaders, 404);
    }

    const cardData = JSON.parse(cardDataRaw);
    if (cardData.creatorId !== creatorId) {
        return jsonResponse({ error: 'Card does not belong to this creator' }, corsHeaders, 403);
    }

    const oneTimeKey = generateKey();
    const usageId = generateUUID();
    const expiresAt = Date.now() + 30 * 60 * 1000;

    await env.CARD_KV.put(`usage:${usageId}`, JSON.stringify({
        usageId,
        cardId,
        creatorId,
        userId,
        oneTimeKey,
        usedAt: Date.now(),
        status: 'pending',
        expiresAt
    }), { expirationTtl: 1800 });

    const logsListRaw = await env.CARD_KV.get(`logs:${creatorId}`);
    const logsList = logsListRaw ? JSON.parse(logsListRaw) : [];
    logsList.push(usageId);
    if (logsList.length > 100) {
        logsList.shift();
    }
    await env.CARD_KV.put(`logs:${creatorId}`, JSON.stringify(logsList));

    return jsonResponse({
        oneTimeKey,
        usageId,
        expiresAt
    }, corsHeaders);
}

async function handleConfirmImport(request, env, corsHeaders) {
    const body = await request.json();
    const { usageId } = body;

    if (!usageId) {
        return jsonResponse({ error: 'UsageId is required' }, corsHeaders, 400);
    }

    const usageDataRaw = await env.CARD_KV.get(`usage:${usageId}`);
    if (!usageDataRaw) {
        return jsonResponse({ error: 'Usage log not found or expired' }, corsHeaders, 404);
    }

    const usageData = JSON.parse(usageDataRaw);

    if (usageData.expiresAt && Date.now() > usageData.expiresAt) {
        await env.CARD_KV.put(`usage:${usageId}`, JSON.stringify({
            ...usageData,
            status: 'expired'
        }), { expirationTtl: 60 });
        return jsonResponse({ error: 'One-time key has expired' }, corsHeaders, 410);
    }

    await env.CARD_KV.put(`usage:${usageId}`, JSON.stringify({
        ...usageData,
        status: 'confirmed',
        confirmedAt: Date.now()
    }), { expirationTtl: 3600 });

    const cardDataRaw = await env.CARD_KV.get(`card:${usageData.cardId}`);
    if (cardDataRaw) {
        const cardData = JSON.parse(cardDataRaw);
        cardData.usageCount = (cardData.usageCount || 0) + 1;
        await env.CARD_KV.put(`card:${usageData.cardId}`, JSON.stringify(cardData));
    }

    return jsonResponse({
        message: 'Import confirmed successfully'
    }, corsHeaders);
}

async function handleGetLogs(request, env, corsHeaders) {
    const url = new URL(request.url);
    const creatorId = url.searchParams.get('creatorId');
    const creatorKey = url.searchParams.get('creatorKey');

    if (!creatorId || !creatorKey) {
        return jsonResponse({ error: 'CreatorId and creatorKey are required' }, corsHeaders, 400);
    }

    const creatorDataRaw = await env.CARD_KV.get(`creator:${creatorId}`);
    if (!creatorDataRaw) {
        return jsonResponse({ error: 'Creator not found' }, corsHeaders, 404);
    }

    const creatorData = JSON.parse(creatorDataRaw);
    if (creatorData.creatorKey !== creatorKey) {
        return jsonResponse({ error: 'Invalid creator key' }, corsHeaders, 403);
    }

    const logsListRaw = await env.CARD_KV.get(`logs:${creatorId}`);
    const logsList = logsListRaw ? JSON.parse(logsListRaw) : [];

    const logs = [];
    for (const usageId of logsList) {
        const usageDataRaw = await env.CARD_KV.get(`usage:${usageId}`);
        if (usageDataRaw) {
            const usageData = JSON.parse(usageDataRaw);
            logs.push({
                usageId: usageData.usageId,
                cardId: usageData.cardId,
                userId: usageData.userId,
                status: usageData.status,
                usedAt: usageData.usedAt,
                confirmedAt: usageData.confirmedAt || null
            });
        }
    }

    logs.sort((a, b) => b.usedAt - a.usedAt);

    return jsonResponse({
        logs,
        total: logs.length
    }, corsHeaders);
}