package com.memory3d.core;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Memory3D {
    
    @JsonProperty("id")
    private String id;
    
    @JsonProperty("sensory")
    @Builder.Default
    private SensoryData sensory = new SensoryData();
    
    @JsonProperty("spatiotemporal")
    private SpatiotemporalData spatiotemporal;
    
    @JsonProperty("emotional")
    @Builder.Default
    private EmotionalData emotional = new EmotionalData();
    
    @JsonProperty("content")
    private String content;
    
    @JsonProperty("metadata")
    private MemoryMetadata metadata;

    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public String toMarkdown() {
        StringBuilder sb = new StringBuilder();
        
        sb.append("---\n");
        sb.append("id: ").append(id).append("\n");
        sb.append("created_at: ").append(metadata.getCreatedAt().toString()).append("\n");
        sb.append("importance: ").append(metadata.getImportance()).append("\n");
        sb.append("resolved: ").append(metadata.getResolved().toString().toLowerCase()).append("\n");
        sb.append("tags: ").append(formatList(metadata.getTags())).append("\n\n");
        
        sb.append("# Sensory Dimension\n");
        sb.append("sensory:\n");
        sb.append("  visual:\n");
        sb.append("    scenes: ").append(formatList(sensory.getVisual().getScenes())).append("\n");
        sb.append("    colors: ").append(formatList(sensory.getVisual().getColors())).append("\n");
        sb.append("    lighting: ").append(sensory.getVisual().getLighting() != null ? sensory.getVisual().getLighting() : "").append("\n");
        sb.append("    objects: ").append(formatList(sensory.getVisual().getObjects())).append("\n");
        sb.append("  auditory:\n");
        sb.append("    sounds: ").append(formatList(sensory.getAuditory().getSounds())).append("\n");
        sb.append("    voice_tone: ").append(sensory.getAuditory().getVoiceTone() != null ? sensory.getAuditory().getVoiceTone() : "").append("\n");
        sb.append("  olfactory:\n");
        sb.append("    scents: ").append(formatList(sensory.getOlfactory().getScents())).append("\n");
        sb.append("  gustatory:\n");
        sb.append("    tastes: ").append(formatList(sensory.getGustatory().getTastes())).append("\n");
        sb.append("  tactile:\n");
        sb.append("    textures: ").append(formatList(sensory.getTactile().getTextures())).append("\n");
        sb.append("    temperature: ").append(sensory.getTactile().getTemperature() != null ? sensory.getTactile().getTemperature() : "").append("\n\n");
        
        sb.append("# Spatiotemporal Dimension\n");
        sb.append("spatiotemporal:\n");
        sb.append("  timestamp:\n");
        sb.append("    absolute: ").append(spatiotemporal.getTimestamp().getAbsolute().toString()).append("\n");
        sb.append("    relative: ").append(spatiotemporal.getTimestamp().getRelative() != null ? spatiotemporal.getTimestamp().getRelative() : "").append("\n");
        sb.append("  location:\n");
        sb.append("    physical: ").append(spatiotemporal.getLocation().getPhysical() != null ? spatiotemporal.getLocation().getPhysical() : "").append("\n");
        sb.append("  context:\n");
        sb.append("    type: ").append(spatiotemporal.getContext().getType() != null ? spatiotemporal.getContext().getType() : "").append("\n");
        sb.append("    activity: ").append(spatiotemporal.getContext().getActivity() != null ? spatiotemporal.getContext().getActivity() : "").append("\n");
        sb.append("  duration: ").append(formatDuration()).append("\n\n");
        
        sb.append("# Emotional Dimension\n");
        sb.append("emotional:\n");
        sb.append("  valence: ").append(emotional.getValence()).append("\n");
        sb.append("  arousal: ").append(emotional.getArousal()).append("\n");
        sb.append("  intensity: ").append(emotional.getIntensity()).append("\n");
        sb.append("  feel: ").append(emotional.getFeel() != null ? emotional.getFeel() : "").append("\n");
        sb.append("---\n\n");
        
        sb.append("# Memory Content\n\n");
        sb.append(content);
        
        return sb.toString();
    }

    private String formatList(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        return "[" + list.stream()
                .map(s -> "\"" + s + "\"")
                .collect(Collectors.joining(", ")) + "]";
    }

    private String formatDuration() {
        if (spatiotemporal.getDuration() != null) {
            SpatiotemporalData.DurationData d = spatiotemporal.getDuration();
            if (d.getValue() != null && d.getUnit() != null) {
                return d.getValue() + d.getUnit();
            }
        }
        return "";
    }

    public static String createId(LocalDateTime timestamp) {
        return "memory_" + timestamp.format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
    }

    public String toJson() {
        try {
            return objectMapper.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize Memory3D to JSON", e);
        }
    }

    public static Memory3D fromJson(String json) {
        try {
            return objectMapper.readValue(json, Memory3D.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize Memory3D from JSON", e);
        }
    }
}
