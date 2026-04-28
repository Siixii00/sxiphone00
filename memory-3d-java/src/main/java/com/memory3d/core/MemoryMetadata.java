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
public class MemoryMetadata {
    
    @JsonProperty("created_at")
    private LocalDateTime createdAt;
    
    @JsonProperty("importance")
    @Builder.Default
    private Integer importance = 5;
    
    @JsonProperty("tags")
    @Builder.Default
    private List<String> tags = new ArrayList<>();
    
    @JsonProperty("resolved")
    @Builder.Default
    private Boolean resolved = false;
    
    @JsonProperty("last_accessed")
    private LocalDateTime lastAccessed;
    
    @JsonProperty("access_count")
    @Builder.Default
    private Integer accessCount = 0;
}
