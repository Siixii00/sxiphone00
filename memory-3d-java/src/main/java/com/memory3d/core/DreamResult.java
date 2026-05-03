package com.memory3d.core;

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
public class DreamResult {
    
    @Builder.Default
    private List<Object> timeline = new ArrayList<>();
    
    @Builder.Default
    private List<String> themes = new ArrayList<>();
    
    private String summary;
    
    @Builder.Default
    private List<String> unresolved = new ArrayList<>();
}
