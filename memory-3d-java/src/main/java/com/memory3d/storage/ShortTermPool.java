package com.memory3d.storage;

import com.memory3d.core.Memory3D;
import com.memory3d.core.MemoryMetadata;
import com.memory3d.core.SensoryData;
import com.memory3d.core.SpatiotemporalData;
import com.memory3d.core.EmotionalData;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.sql.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
public class ShortTermPool {

    private final String dbPath;
    private final ObjectMapper objectMapper;

    public ShortTermPool() {
        this("./data/short_term.db");
    }

    public ShortTermPool(String dbPath) {
        this.dbPath = dbPath;
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule());
        initDb();
    }

    private void initDb() {
        String createTableSql = """
                CREATE TABLE IF NOT EXISTS short_term_memories (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    sensory TEXT,
                    spatiotemporal TEXT,
                    emotional TEXT,
                    metadata TEXT,
                    created_at TIMESTAMP,
                    processed BOOLEAN DEFAULT FALSE,
                    processed_at TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_created_at ON short_term_memories(created_at);
                CREATE INDEX IF NOT EXISTS idx_processed ON short_term_memories(processed);
                """;

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             Statement stmt = conn.createStatement()) {
            stmt.execute(createTableSql);
            log.info("ShortTermPool initialized at {}", dbPath);
        } catch (SQLException e) {
            log.error("Failed to initialize ShortTermPool", e);
        }
    }

    public boolean add(Memory3D memory) {
        String sql = """
                INSERT OR REPLACE INTO short_term_memories 
                (id, content, sensory, spatiotemporal, emotional, metadata, created_at, processed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, memory.getId());
            pstmt.setString(2, memory.getContent());
            pstmt.setString(3, objectMapper.writeValueAsString(memory.getSensory()));
            pstmt.setString(4, objectMapper.writeValueAsString(memory.getSpatiotemporal()));
            pstmt.setString(5, objectMapper.writeValueAsString(memory.getEmotional()));
            pstmt.setString(6, objectMapper.writeValueAsString(memory.getMetadata()));
            pstmt.setString(7, memory.getMetadata().getCreatedAt().toString());
            pstmt.setBoolean(8, false);

            pstmt.executeUpdate();
            log.debug("Added memory to short-term pool: {}", memory.getId());
            return true;
        } catch (Exception e) {
            log.error("Failed to add memory {}", memory.getId(), e);
            return false;
        }
    }

    public Memory3D get(String memoryId) {
        String sql = "SELECT * FROM short_term_memories WHERE id = ?";

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, memoryId);
            ResultSet rs = pstmt.executeQuery();

            if (rs.next()) {
                return rowToMemory(rs);
            }
        } catch (Exception e) {
            log.error("Failed to get memory {}", memoryId, e);
        }

        return null;
    }

    public List<Memory3D> getAllUnprocessed() {
        String sql = "SELECT * FROM short_term_memories WHERE processed = FALSE ORDER BY created_at ASC";
        List<Memory3D> memories = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                memories.add(rowToMemory(rs));
            }
        } catch (Exception e) {
            log.error("Failed to get unprocessed memories", e);
        }

        return memories;
    }

    public List<Memory3D> getTodayMemories() {
        String sql = "SELECT * FROM short_term_memories WHERE date(created_at) = date('now') AND processed = FALSE ORDER BY created_at ASC";
        List<Memory3D> memories = new ArrayList<>();

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                memories.add(rowToMemory(rs));
            }
        } catch (Exception e) {
            log.error("Failed to get today's memories", e);
        }

        return memories;
    }

    public boolean markProcessed(String memoryId) {
        String sql = "UPDATE short_term_memories SET processed = TRUE, processed_at = ? WHERE id = ?";

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, LocalDateTime.now().toString());
            pstmt.setString(2, memoryId);
            pstmt.executeUpdate();

            log.debug("Marked memory as processed: {}", memoryId);
            return true;
        } catch (Exception e) {
            log.error("Failed to mark memory {} as processed", memoryId, e);
            return false;
        }
    }

    public int count() {
        return count(false);
    }

    public int count(boolean unprocessedOnly) {
        String sql = unprocessedOnly
                ? "SELECT COUNT(*) FROM short_term_memories WHERE processed = FALSE"
                : "SELECT COUNT(*) FROM short_term_memories";

        try (Connection conn = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            if (rs.next()) {
                return rs.getInt(1);
            }
        } catch (Exception e) {
            log.error("Failed to count memories", e);
        }

        return 0;
    }

    private Memory3D rowToMemory(ResultSet rs) throws Exception {
        SensoryData sensory = objectMapper.readValue(rs.getString("sensory"), SensoryData.class);
        SpatiotemporalData spatiotemporal = objectMapper.readValue(rs.getString("spatiotemporal"), SpatiotemporalData.class);
        EmotionalData emotional = objectMapper.readValue(rs.getString("emotional"), EmotionalData.class);
        MemoryMetadata metadata = objectMapper.readValue(rs.getString("metadata"), MemoryMetadata.class);

        return Memory3D.builder()
                .id(rs.getString("id"))
                .content(rs.getString("content"))
                .sensory(sensory)
                .spatiotemporal(spatiotemporal)
                .emotional(emotional)
                .metadata(metadata)
                .build();
    }
}
