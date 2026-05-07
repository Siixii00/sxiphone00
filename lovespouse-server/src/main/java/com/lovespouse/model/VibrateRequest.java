package com.lovespouse.model;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class VibrateRequest {
    
    @NotNull
    @Min(0)
    @Max(3)
    private Integer intensity;
    
    @NotNull
    @Min(0)
    private Integer duration;

    public Integer getIntensity() {
        return intensity;
    }

    public void setIntensity(Integer intensity) {
        this.intensity = intensity;
    }

    public Integer getDuration() {
        return duration;
    }

    public void setDuration(Integer duration) {
        this.duration = duration;
    }
}
