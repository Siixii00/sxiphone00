package com.memory3d.core;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class SpatiotemporalTagger {

    private String timezone = "Asia/Taipei";
    private boolean autoTag = true;
    private boolean locationDetection = true;

    private static final List<Pattern> LOCATION_PATTERNS = Arrays.asList(
            Pattern.compile("在(.{2,10}?)(?:聊天|見面|吃飯|喝咖啡|開會|工作)"),
            Pattern.compile("去了(.{2,10})"),
            Pattern.compile("來到(.{2,10})"),
            Pattern.compile("位於(.{2,10})"),
            Pattern.compile("at\\s+(?:the\\s+)?(\\w+(?:\\s+\\w+){0,3})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("in\\s+(?:the\\s+)?(\\w+(?:\\s+\\w+){0,3})", Pattern.CASE_INSENSITIVE)
    );

    private static final Map<String, List<String>> CONTEXT_KEYWORDS = Map.of(
            "工作", List.of("工作", "開會", "會議", "報告", "專案", "work", "meeting", "project", "report"),
            "休閒", List.of("休閒", "放鬆", "娛樂", "遊戲", "電影", "leisure", "relax", "entertainment", "game", "movie"),
            "社交", List.of("社交", "朋友", "聚會", "聊天", "吃飯", "social", "friend", "party", "chat", "dinner"),
            "獨處", List.of("獨處", "一個人", "自己", "alone", "solitude", "by myself"),
            "學習", List.of("學習", "讀書", "上課", "考試", "study", "learn", "class", "exam"),
            "運動", List.of("運動", "健身", "跑步", "游泳", "exercise", "gym", "running", "swimming")
    );

    private static final List<Pattern> DURATION_PATTERNS = Arrays.asList(
            Pattern.compile("(\\d+)\\s*小時"),
            Pattern.compile("(\\d+)\\s*分鐘"),
            Pattern.compile("(\\d+)\\s*秒"),
            Pattern.compile("(\\d+)\\s*天"),
            Pattern.compile("半小時"),
            Pattern.compile("一小時"),
            Pattern.compile("(\\d+)\\s*hours?", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(\\d+)\\s*minutes?", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Object[]> RELATIVE_TIME_PATTERNS = Arrays.asList(
            new Object[]{"今天", "今天"},
            new Object[]{"昨天", "昨天"},
            new Object[]{"前天", "前天"},
            new Object[]{"明天", "明天"},
            new Object[]{"上週", "上週"},
            new Object[]{"下週", "下週"},
            new Object[]{"上個月", "上個月"},
            new Object[]{"這週", "這週"},
            new Object[]{"週末", "週末"},
            new Object[]{"早上", "早上"},
            new Object[]{"下午", "下午"},
            new Object[]{"晚上", "晚上"},
            new Object[]{"凌晨", "凌晨"},
            new Object[]{"中午", "中午"},
            new Object[]{"today", "今天"},
            new Object[]{"yesterday", "昨天"},
            new Object[]{"tomorrow", "明天"},
            new Object[]{"last week", "上週"},
            new Object[]{"next week", "下週"},
            new Object[]{"morning", "早上"},
            new Object[]{"afternoon", "下午"},
            new Object[]{"evening", "晚上"}
    );

    private static final List<String> VIRTUAL_INDICATORS = Arrays.asList(
            "線上", "網路", "視訊", "電話", "online", "virtual", "video call", "phone"
    );

    public SpatiotemporalData tag(String content) {
        return tag(content, null, null, null);
    }

    public SpatiotemporalData tag(String content, LocalDateTime timestamp, String location, String contextType) {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }

        SpatiotemporalData.TimestampData timestampData = extractTimestamp(content, timestamp);
        SpatiotemporalData.LocationData locationData = extractLocation(content, location);
        SpatiotemporalData.ContextData contextData = extractContext(content, contextType);
        SpatiotemporalData.DurationData durationData = extractDuration(content);

        return SpatiotemporalData.builder()
                .timestamp(timestampData)
                .location(locationData)
                .context(contextData)
                .duration(durationData)
                .build();
    }

    private SpatiotemporalData.TimestampData extractTimestamp(String content, LocalDateTime baseTime) {
        String relative = null;
        String period = null;

        for (Object[] pattern : RELATIVE_TIME_PATTERNS) {
            String regex = (String) pattern[0];
            if (content.toLowerCase().contains(regex.toLowerCase())) {
                relative = (String) pattern[1];
                break;
            }
        }

        int hour = baseTime.getHour();
        if (hour >= 5 && hour < 12) {
            period = "早上";
        } else if (hour >= 12 && hour < 14) {
            period = "中午";
        } else if (hour >= 14 && hour < 18) {
            period = "下午";
        } else if (hour >= 18 && hour < 22) {
            period = "晚上";
        } else {
            period = "凌晨";
        }

        return SpatiotemporalData.TimestampData.builder()
                .absolute(baseTime)
                .relative(relative)
                .period(period)
                .build();
    }

    private SpatiotemporalData.LocationData extractLocation(String content, String hint) {
        String physical = hint;
        String virtual = null;

        if (physical == null && locationDetection) {
            for (Pattern pattern : LOCATION_PATTERNS) {
                Matcher matcher = pattern.matcher(content);
                if (matcher.find()) {
                    physical = matcher.group(1).trim();
                    break;
                }
            }
        }

        String contentLower = content.toLowerCase();
        for (String indicator : VIRTUAL_INDICATORS) {
            if (contentLower.contains(indicator.toLowerCase())) {
                virtual = indicator;
                break;
            }
        }

        return SpatiotemporalData.LocationData.builder()
                .physical(physical)
                .virtual(virtual)
                .build();
    }

    private SpatiotemporalData.ContextData extractContext(String content, String hint) {
        String contextType = hint;
        String activity = null;
        List<String> participants = new ArrayList<>();

        if (contextType == null) {
            String contentLower = content.toLowerCase();
            int maxMatches = 0;

            for (Map.Entry<String, List<String>> entry : CONTEXT_KEYWORDS.entrySet()) {
                int matches = 0;
                for (String keyword : entry.getValue()) {
                    if (contentLower.contains(keyword.toLowerCase())) {
                        matches++;
                    }
                }
                if (matches > maxMatches) {
                    maxMatches = matches;
                    contextType = entry.getKey();
                }
            }
        }

        List<Pattern> activityPatterns = Arrays.asList(
                Pattern.compile("在(.{2,10})"),
                Pattern.compile("一起(.{2,10})"),
                Pattern.compile("正在(.{2,10})")
        );

        for (Pattern pattern : activityPatterns) {
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                activity = matcher.group(1).trim();
                break;
            }
        }

        List<Pattern> participantPatterns = Arrays.asList(
                Pattern.compile("和(.{2,8}?)(?:一起|聊天|見面)"),
                Pattern.compile("跟(.{2,8}?)(?:一起|聊天|見面)"),
                Pattern.compile("與(.{2,8}?)(?:一起|聊天|見面)"),
                Pattern.compile("with\\s+(\\w+)", Pattern.CASE_INSENSITIVE)
        );

        for (Pattern pattern : participantPatterns) {
            Matcher matcher = pattern.matcher(content);
            while (matcher.find()) {
                String name = matcher.group(1).trim();
                if (name.length() < 10) {
                    participants.add(name);
                }
            }
        }

        return SpatiotemporalData.ContextData.builder()
                .type(contextType)
                .activity(activity)
                .participants(participants)
                .build();
    }

    private SpatiotemporalData.DurationData extractDuration(String content) {
        int index = 0;
        for (Pattern pattern : DURATION_PATTERNS) {
            Matcher matcher = pattern.matcher(content);
            if (matcher.find()) {
                String unit;
                int value;

                if (index == 4) { // 半小時
                    value = 30;
                    unit = "分鐘";
                } else if (index == 5) { // 一小時
                    value = 60;
                    unit = "分鐘";
                } else {
                    value = Integer.parseInt(matcher.group(1));
                    if (index == 0 || index == 6) unit = "小時";
                    else if (index == 1 || index == 7) unit = "分鐘";
                    else if (index == 2) unit = "秒";
                    else unit = "天";
                }

                return SpatiotemporalData.DurationData.builder()
                        .value(value)
                        .unit(unit)
                        .description(value + unit)
                        .build();
            }
            index++;
        }

        return null;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public void setAutoTag(boolean autoTag) {
        this.autoTag = autoTag;
    }

    public void setLocationDetection(boolean locationDetection) {
        this.locationDetection = locationDetection;
    }
}
