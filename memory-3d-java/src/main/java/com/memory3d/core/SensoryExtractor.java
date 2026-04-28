package com.memory3d.core;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class SensoryExtractor {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final OkHttpClient httpClient = new OkHttpClient();
    private final Map<String, SensoryData> cache = new ConcurrentHashMap<>();

    private String apiKey;
    private String baseUrl;
    private String model = "gemini-2.5-flash-lite";
    private boolean fallbackToRules = true;
    private boolean cacheEnabled = true;

    private static final String SENSORY_EXTRACTION_PROMPT = """
            Extract sensory information from the following text. Return a JSON object with these fields:

            {
                "visual": {
                    "scenes": ["list of scenes/locations mentioned"],
                    "colors": ["list of colors mentioned"],
                    "lighting": "lighting description if any",
                    "objects": ["list of physical objects mentioned"],
                    "people": ["list of people mentioned"]
                },
                "auditory": {
                    "sounds": ["list of sounds mentioned"],
                    "voice_tone": "description of voice tone if mentioned",
                    "volume": "volume level if mentioned",
                    "background": "background sounds if mentioned"
                },
                "olfactory": {
                    "scents": ["list of smells/scents mentioned"],
                    "intensity": "intensity description if mentioned"
                },
                "gustatory": {
                    "tastes": ["list of tastes/foods mentioned"],
                    "flavors": ["list of flavor descriptions"]
                },
                "tactile": {
                    "textures": ["list of textures mentioned"],
                    "temperature": "temperature description if mentioned",
                    "sensations": ["list of physical sensations"]
                }
            }

            Only include fields that have actual content from the text. If nothing is found for a category, return empty lists/null.

            Text: %s

            Return only the JSON object, no additional text.""";

    private static final Map<String, List<String>> VISUAL_KEYWORDS = Map.of(
            "scenes", List.of("咖啡廳", "餐廳", "公園", "海邊", "山上", "房間", "辦公室", "街道", "商店", "學校", "醫院", "圖書館", "cafe", "restaurant", "park", "beach", "mountain", "room", "office", "street", "shop", "school", "hospital", "library"),
            "colors", List.of("紅", "藍", "綠", "黃", "白", "黑", "紫", "橙", "粉紅", "灰", "red", "blue", "green", "yellow", "white", "black", "purple", "orange", "pink", "gray"),
            "lighting", List.of("明亮", "昏暗", "柔和", "陽光", "燈光", "燭光", "bright", "dim", "soft", "sunlight", "lamplight", "candlelight"),
            "objects", List.of("桌子", "椅子", "杯子", "書", "電腦", "手機", "車", "花", "樹", "table", "chair", "cup", "book", "computer", "phone", "car", "flower", "tree")
    );

    private static final Map<String, List<String>> AUDITORY_KEYWORDS = Map.of(
            "sounds", List.of("音樂", "歌聲", "鳥叫", "風聲", "雨聲", "車聲", "笑聲", "music", "singing", "birds", "wind", "rain", "traffic", "laughter"),
            "voice_tone", List.of("溫柔", "嚴厲", "興奮", "平靜", "生氣", "悲傷", "gentle", "stern", "excited", "calm", "angry", "sad"),
            "volume", List.of("大聲", "小聲", "安靜", "吵雜", "loud", "quiet", "noisy")
    );

    private static final Map<String, List<String>> OLFACTORY_KEYWORDS = Map.of(
            "scents", List.of("香", "臭", "咖啡香", "花香", "食物香", "香水", "fragrance", "smell", "coffee", "flower", "food", "perfume")
    );

    private static final Map<String, List<String>> GUSTATORY_KEYWORDS = Map.of(
            "tastes", List.of("甜", "酸", "苦", "辣", "鹹", "鮮", "sweet", "sour", "bitter", "spicy", "salty", "umami"),
            "flavors", List.of("巧克力", "草莓", "咖啡", "茶", "酒", "chocolate", "strawberry", "coffee", "tea", "wine")
    );

    private static final Map<String, List<String>> TACTILE_KEYWORDS = Map.of(
            "textures", List.of("柔軟", "堅硬", "光滑", "粗糙", "濕", "乾", "soft", "hard", "smooth", "rough", "wet", "dry"),
            "temperature", List.of("熱", "冷", "溫暖", "涼爽", "hot", "cold", "warm", "cool"),
            "sensations", List.of("痛", "癢", "麻", "舒適", "疼痛", "pain", "itchy", "numb", "comfortable")
    );

    public SensoryData extract(String text) {
        if (cacheEnabled) {
            String cacheKey = getCacheKey(text);
            if (cache.containsKey(cacheKey)) {
                log.debug("Cache hit for sensory extraction");
                return cache.get(cacheKey);
            }
        }

        SensoryData sensoryData = null;

        if (apiKey != null && baseUrl != null) {
            try {
                sensoryData = extractWithLlm(text);
            } catch (Exception e) {
                log.warn("LLM extraction failed: {}", e.getMessage());
                if (fallbackToRules) {
                    sensoryData = extractWithRules(text);
                }
            }
        } else if (fallbackToRules) {
            sensoryData = extractWithRules(text);
        }

        if (sensoryData == null) {
            sensoryData = new SensoryData();
        }

        if (cacheEnabled) {
            String cacheKey = getCacheKey(text);
            cache.put(cacheKey, sensoryData);
        }

        return sensoryData;
    }

    private SensoryData extractWithLlm(String text) throws IOException {
        String prompt = String.format(SENSORY_EXTRACTION_PROMPT, text);

        MediaType mediaType = MediaType.parse("application/json");
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", prompt)),
                "temperature", 0.1,
                "max_tokens", 1000
        ));

        Request request = new Request.Builder()
                .url(baseUrl + "/chat/completions")
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(requestBody, mediaType))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new IOException("LLM API call failed: " + response.code());
            }

            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            String content = root.path("choices").path(0).path("message").path("content").asText();

            Pattern jsonPattern = Pattern.compile("\\{[\\s\\S]*\\}");
            Matcher matcher = jsonPattern.matcher(content);
            if (matcher.find()) {
                JsonNode data = objectMapper.readTree(matcher.group());
                return parseLlmResponse(data);
            }
        }

        return null;
    }

    private SensoryData parseLlmResponse(JsonNode data) {
        SensoryData.SensoryDataBuilder builder = SensoryData.builder();

        if (data.has("visual")) {
            JsonNode v = data.get("visual");
            builder.visual(SensoryData.VisualData.builder()
                    .scenes(parseStringList(v.path("scenes")))
                    .colors(parseStringList(v.path("colors")))
                    .lighting(v.path("lighting").asText(null))
                    .objects(parseStringList(v.path("objects")))
                    .people(parseStringList(v.path("people")))
                    .build());
        }

        if (data.has("auditory")) {
            JsonNode a = data.get("auditory");
            builder.auditory(SensoryData.AuditoryData.builder()
                    .sounds(parseStringList(a.path("sounds")))
                    .voiceTone(a.path("voice_tone").asText(null))
                    .volume(a.path("volume").asText(null))
                    .background(a.path("background").asText(null))
                    .build());
        }

        if (data.has("olfactory")) {
            JsonNode o = data.get("olfactory");
            builder.olfactory(SensoryData.OlfactoryData.builder()
                    .scents(parseStringList(o.path("scents")))
                    .intensity(o.path("intensity").asText(null))
                    .build());
        }

        if (data.has("gustatory")) {
            JsonNode g = data.get("gustatory");
            builder.gustatory(SensoryData.GustatoryData.builder()
                    .tastes(parseStringList(g.path("tastes")))
                    .flavors(parseStringList(g.path("flavors")))
                    .build());
        }

        if (data.has("tactile")) {
            JsonNode t = data.get("tactile");
            builder.tactile(SensoryData.TactileData.builder()
                    .textures(parseStringList(t.path("textures")))
                    .temperature(t.path("temperature").asText(null))
                    .sensations(parseStringList(t.path("sensations")))
                    .build());
        }

        return builder.build();
    }

    private List<String> parseStringList(JsonNode node) {
        if (node.isArray()) {
            List<String> result = new ArrayList<>();
            for (JsonNode item : node) {
                result.add(item.asText());
            }
            return result;
        }
        return new ArrayList<>();
    }

    private SensoryData extractWithRules(String text) {
        String textLower = text.toLowerCase();

        Map<String, String> visual = extractCategory(textLower, VISUAL_KEYWORDS);
        Map<String, String> auditory = extractCategory(textLower, AUDITORY_KEYWORDS);
        Map<String, String> olfactory = extractCategory(textLower, OLFACTORY_KEYWORDS);
        Map<String, String> gustatory = extractCategory(textLower, GUSTATORY_KEYWORDS);
        Map<String, String> tactile = extractCategory(textLower, TACTILE_KEYWORDS);

        return SensoryData.builder()
                .visual(SensoryData.VisualData.builder()
                        .scenes(parseKeywordResults(visual.get("scenes")))
                        .colors(parseKeywordResults(visual.get("colors")))
                        .lighting(visual.get("lighting"))
                        .objects(parseKeywordResults(visual.get("objects")))
                        .build())
                .auditory(SensoryData.AuditoryData.builder()
                        .sounds(parseKeywordResults(auditory.get("sounds")))
                        .voiceTone(auditory.get("voice_tone"))
                        .volume(auditory.get("volume"))
                        .build())
                .olfactory(SensoryData.OlfactoryData.builder()
                        .scents(parseKeywordResults(olfactory.get("scents")))
                        .build())
                .gustatory(SensoryData.GustatoryData.builder()
                        .tastes(parseKeywordResults(gustatory.get("tastes")))
                        .flavors(parseKeywordResults(gustatory.get("flavors")))
                        .build())
                .tactile(SensoryData.TactileData.builder()
                        .textures(parseKeywordResults(tactile.get("textures")))
                        .temperature(tactile.get("temperature"))
                        .sensations(parseKeywordResults(tactile.get("sensations")))
                        .build())
                .build();
    }

    private Map<String, String> extractCategory(String text, Map<String, List<String>> keywords) {
        Map<String, String> result = new HashMap<>();

        for (Map.Entry<String, List<String>> entry : keywords.entrySet()) {
            String category = entry.getKey();
            List<String> words = entry.getValue();

            List<String> found = new ArrayList<>();
            for (String word : words) {
                if (text.contains(word.toLowerCase())) {
                    found.add(word);
                }
            }

            if (!found.isEmpty()) {
                if (List.of("lighting", "voice_tone", "volume", "temperature").contains(category)) {
                    result.put(category, found.get(0));
                } else {
                    result.put(category, String.join(",", found));
                }
            }
        }

        return result;
    }

    private List<String> parseKeywordResults(String result) {
        if (result == null || result.isEmpty()) {
            return new ArrayList<>();
        }
        return Arrays.asList(result.split(","));
    }

    private String getCacheKey(String text) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
            byte[] digest = md.digest(text.getBytes());
            return java.util.Base64.getEncoder().encodeToString(digest);
        } catch (Exception e) {
            return text.hashCode() + "";
        }
    }

    public void clearCache() {
        cache.clear();
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public void setFallbackToRules(boolean fallbackToRules) {
        this.fallbackToRules = fallbackToRules;
    }

    public void setCacheEnabled(boolean cacheEnabled) {
        this.cacheEnabled = cacheEnabled;
    }
}
