package com.memory3d.core;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmotionalData {
    
    @JsonProperty("valence")
    @Builder.Default
    private Double valence = 0.0;
    
    @JsonProperty("arousal")
    @Builder.Default
    private Double arousal = 0.0;
    
    @JsonProperty("intensity")
    @Builder.Default
    private Double intensity = 0.0;
    
    @JsonProperty("feel")
    private String feel;
}
