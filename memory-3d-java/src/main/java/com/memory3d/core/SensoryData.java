package com.memory3d.core;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensoryData {
    
    @JsonProperty("visual")
    @Builder.Default
    private VisualData visual = new VisualData();
    
    @JsonProperty("auditory")
    @Builder.Default
    private AuditoryData auditory = new AuditoryData();
    
    @JsonProperty("olfactory")
    @Builder.Default
    private OlfactoryData olfactory = new OlfactoryData();
    
    @JsonProperty("gustatory")
    @Builder.Default
    private GustatoryData gustatory = new GustatoryData();
    
    @JsonProperty("tactile")
    @Builder.Default
    private TactileData tactile = new TactileData();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VisualData {
        @Builder.Default
        private List<String> scenes = new ArrayList<>();
        @Builder.Default
        private List<String> colors = new ArrayList<>();
        private String lighting;
        @Builder.Default
        private List<String> objects = new ArrayList<>();
        @Builder.Default
        private List<String> people = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuditoryData {
        @Builder.Default
        private List<String> sounds = new ArrayList<>();
        private String voiceTone;
        private String volume;
        private String background;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OlfactoryData {
        @Builder.Default
        private List<String> scents = new ArrayList<>();
        private String intensity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GustatoryData {
        @Builder.Default
        private List<String> tastes = new ArrayList<>();
        @Builder.Default
        private List<String> flavors = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TactileData {
        @Builder.Default
        private List<String> textures = new ArrayList<>();
        private String temperature;
        @Builder.Default
        private List<String> sensations = new ArrayList<>();
    }
}
