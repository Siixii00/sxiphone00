package com.memory3d.mcp;

import com.memory3d.core.*;
import com.memory3d.storage.ShortTermPool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/mcp")
@RequiredArgsConstructor
public class Memory3DTools {

    private final Memory3DBuilder memoryBuilder;
    private final ShortTermPool shortTermPool;

    @PostMapping("/hold")
    public Map<String, Object> hold(@RequestBody Map<String, Object> request) {
        log.info("hold: Storing memory");

        String content = (String) request.get("content");
        Integer importance = (Integer) request.getOrDefault("importance", 5);

        Memory3D memory = memoryBuilder.build(content);

        shortTermPool.add(memory);

        return Map.of(
                "status", "success",
                "memory_id", memory.getId(),
                "sensory", memory.getSensory(),
                "spatiotemporal", memory.getSpatiotemporal(),
                "emotional", memory.getEmotional()
        );
    }

    @PostMapping("/recall")
    public Map<String, Object> recall(@RequestBody Map<String, Object> request) {
        log.info("recall: Searching memories");

        String query = (String) request.get("query");
        String domain = (String) request.get("domain");

        if ("collect".equals(domain)) {
            return Map.of(
                    "status", "success",
                    "type", "collects",
                    "count", 0,
                    "collects", Collections.emptyList()
            );
        }

        if (query == null) {
            return Map.of(
                    "status", "success",
                    "type", "surfaced",
                    "count", 0,
                    "memories", Collections.emptyList()
            );
        }

        return Map.of(
                "status", "success",
                "type", "search",
                "count", 0,
                "memories", Collections.emptyList()
        );
    }

    @PostMapping("/collect_memory")
    public Map<String, Object> collectMemory(@RequestBody Map<String, Object> request) {
        log.info("collect_memory: Creating collect");

        String sourceMemoryId = (String) request.get("source_memory_id");

        return Map.of(
                "status", "success",
                "collect_id", "collect_" + System.currentTimeMillis(),
                "reflection", "This is a collected memory",
                "source_resolved", true
        );
    }

    @PostMapping("/sleep")
    public Map<String, Object> sleep(@RequestBody Map<String, Object> request) {
        log.info("sleep: Triggering sleep cycle");

        return Map.of(
                "status", "completed",
                "processed_memories", 0,
                "generated_collects", 0,
                "stages", Collections.emptyMap(),
                "errors", Collections.emptyList()
        );
    }

    @PostMapping("/awake")
    public Map<String, Object> awake() {
        log.info("awake: Daily awakening");

        return Map.of(
                "status", "awakened",
                "greeting", "早安！今天想聊些什麼呢？",
                "memory_summary", "最近沒有特別的記憶。",
                "todos", Collections.emptyList(),
                "emotional_state", Map.of("mood", "neutral", "energy", 0.7)
        );
    }

    @PostMapping("/digest")
    public Map<String, Object> digest() {
        log.info("digest: Processing recent memories");

        return Map.of(
                "status", "success",
                "timeline", Collections.emptyList(),
                "themes", Collections.emptyList(),
                "summary", "最近沒有特別的記憶，心境平靜。",
                "unresolved", Collections.emptyList()
        );
    }

    @PostMapping("/conversation_start")
    public Map<String, Object> conversationStart() {
        log.info("conversation_start: Starting full conversation sequence");

        return Map.of(
                "status", "success",
                "surfaced_memories", 0,
                "summary", "最近沒有特別的記憶，心境平靜。",
                "themes", Collections.emptyList(),
                "previous_collects", 0,
                "new_collects_generated", 0,
                "collects", Collections.emptyList(),
                "unresolved", Collections.emptyList()
        );
    }

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return Map.of(
                "status", "running",
                "short_term_count", shortTermPool.count(),
                "unprocessed_count", shortTermPool.count(true)
        );
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "ok",
                "buckets", shortTermPool.count(),
                "decay_engine", "stopped"
        );
    }
}
