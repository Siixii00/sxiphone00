package com.memory3d.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Data
@Component
@ConfigurationProperties(prefix = "memory3d")
public class Memory3DConfig {

    private SystemConfig system = new SystemConfig();
    private StorageConfig storage = new StorageConfig();
    private ApiConfig api = new ApiConfig();
    private SensoryConfig sensory = new SensoryConfig();
    private SpatiotemporalConfig spatiotemporal = new SpatiotemporalConfig();
    private SleepConfig sleep = new SleepConfig();
    private AwakeningConfig awakening = new AwakeningConfig();
    private SearchConfig search = new SearchConfig();
    private DecayConfig decay = new DecayConfig();

    @Data
    public static class SystemConfig {
        private String name = "Memory3D";
        private String version = "1.0.0";
        private String transport = "stdio";
        private String timezone = "Asia/Taipei";
    }

    @Data
    public static class StorageConfig {
        private String vaultPath = "./vault/Memory3D";
        private String bucketsDir = "./buckets/";
        private String indexDb = "./data/indexes.db";
        private String shortTermDb = "./data/short_term.db";
    }

    @Data
    public static class ApiConfig {
        private String provider = "google";
        private String apiKeyEnv = "MEMORY3D_API_KEY";
        private String baseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
        private Map<String, String> models = new HashMap<>(Map.of(
                "sensory_extraction", "gemini-2.5-flash-lite",
                "feel_generation", "gemini-2.5-flash-lite",
                "embedding", "gemini-embedding-001"
        ));
        private Map<String, Integer> rateLimits = new HashMap<>(Map.of(
                "requests_per_minute", 30,
                "requests_per_day", 1500
        ));
    }

    @Data
    public static class SensoryConfig {
        private boolean enabled = true;
        private boolean extractOnHold = true;
        private boolean cacheEnabled = true;
        private long cacheTtl = 86400;
        private boolean fallbackToRules = true;
    }

    @Data
    public static class SpatiotemporalConfig {
        private boolean enabled = true;
        private boolean autoTag = true;
        private String timezone = "Asia/Taipei";
        private boolean locationDetection = true;
    }

    @Data
    public static class SleepConfig {
        private boolean enabled = true;
        private String startTime = "02:00";
        private String endTime = "06:00";
        private String timezone = "Asia/Taipei";
        private int durationHours = 4;
        private Map<String, Integer> stages = new HashMap<>(Map.of(
                "nrem1", 10,
                "nrem2", 20,
                "nrem3", 30,
                "rem", 30
        ));
        private boolean retryOnFailure = true;
        private int maxRetries = 3;
    }

    @Data
    public static class AwakeningConfig {
        private boolean enabled = true;
        private int recallDays = 7;
        private int minImportance = 5;
        private boolean generateSummary = true;
        private boolean greetingEnabled = true;
    }

    @Data
    public static class SearchConfig {
        private double sensoryWeight = 0.3;
        private double spatiotemporalWeight = 0.3;
        private double emotionalWeight = 0.4;
        private int topK = 20;
        private boolean parallelSearch = true;
        private long resultCacheTtl = 3600;
    }

    @Data
    public static class DecayConfig {
        private double lambda = 0.05;
        private double threshold = 0.3;
        private double activationBoost = 0.3;
        private double emotionalResistance = 0.8;
    }
}
