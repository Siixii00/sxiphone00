package com.memory3d.core;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpatiotemporalData {
    
    @JsonProperty("timestamp")
    private TimestampData timestamp;
    
    @JsonProperty("location")
    @Builder.Default
    private LocationData location = new LocationData();
    
    @JsonProperty("context")
    @Builder.Default
    private ContextData context = new ContextData();
    
    @JsonProperty("duration")
    private DurationData duration;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimestampData {
        private LocalDateTime absolute;
        private String relative;
        private String period;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocationData {
        private String physical;
        private String virtual;
        private List<Double> coordinates;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextData {
        private String type;
        private String activity;
        @Builder.Default
        private List<String> participants = new ArrayList<>();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DurationData {
        private Integer value;
        private String unit;
        private String description;
    }
}
