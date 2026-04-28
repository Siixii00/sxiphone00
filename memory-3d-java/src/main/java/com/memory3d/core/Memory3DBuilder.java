package com.memory3d.core;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class Memory3DBuilder {

    private final SensoryExtractor sensoryExtractor;
    private final SpatiotemporalTagger spatiotemporalTagger;

    private boolean autoExtractSensory = true;
    private boolean autoTagSpatiotemporal = true;

    public Memory3D build(String content) {
        return build(content, null, null, null, 5, null, null);
    }

    public Memory3D build(
            String content,
            SensoryData sensory,
            SpatiotemporalData spatiotemporal,
            EmotionalData emotional,
            int importance,
            List<String> tags,
            LocalDateTime timestamp
    ) {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }

        if (sensory == null && autoExtractSensory) {
            log.debug("Auto-extracting sensory data");
            sensory = sensoryExtractor.extract(content);
        }

        if (spatiotemporal == null && autoTagSpatiotemporal) {
            log.debug("Auto-tagging spatiotemporal data");
            spatiotemporal = spatiotemporalTagger.tag(content, timestamp, null, null);
        }

        if (spatiotemporal == null) {
            spatiotemporal = SpatiotemporalData.builder()
                    .timestamp(SpatiotemporalData.TimestampData.builder()
                            .absolute(timestamp)
                            .build())
                    .build();
        }

        if (sensory == null) {
            sensory = new SensoryData();
        }

        if (emotional == null) {
            emotional = new EmotionalData();
        }

        if (tags == null) {
            tags = extractTags(content, spatiotemporal);
        }

        String memoryId = Memory3D.createId(timestamp);

        MemoryMetadata metadata = MemoryMetadata.builder()
                .createdAt(timestamp)
                .importance(importance)
                .tags(new ArrayList<>(tags))
                .resolved(false)
                .build();

        Memory3D memory = Memory3D.builder()
                .id(memoryId)
                .sensory(sensory)
                .spatiotemporal(spatiotemporal)
                .emotional(emotional)
                .content(content)
                .metadata(metadata)
                .build();

        log.info("Built memory: {}", memoryId);
        return memory;
    }

    private List<String> extractTags(String content, SpatiotemporalData spatiotemporal) {
        Set<String> tags = new HashSet<>();

        if (spatiotemporal.getContext() != null && spatiotemporal.getContext().getType() != null) {
            tags.add(spatiotemporal.getContext().getType());
        }

        if (spatiotemporal.getLocation() != null && spatiotemporal.getLocation().getPhysical() != null) {
            tags.add(spatiotemporal.getLocation().getPhysical());
        }

        if (spatiotemporal.getTimestamp() != null && spatiotemporal.getTimestamp().getRelative() != null) {
            tags.add(spatiotemporal.getTimestamp().getRelative());
        }

        if (spatiotemporal.getContext() != null && spatiotemporal.getContext().getParticipants() != null) {
            int count = 0;
            for (String participant : spatiotemporal.getContext().getParticipants()) {
                if (count < 3) {
                    tags.add(participant);
                    count++;
                }
            }
        }

        return new ArrayList<>(tags);
    }

    public void setAutoExtractSensory(boolean autoExtractSensory) {
        this.autoExtractSensory = autoExtractSensory;
    }

    public void setAutoTagSpatiotemporal(boolean autoTagSpatiotemporal) {
        this.autoTagSpatiotemporal = autoTagSpatiotemporal;
    }
}
