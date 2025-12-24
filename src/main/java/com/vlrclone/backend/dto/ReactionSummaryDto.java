package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ReactionType;

import java.util.Map;

public class ReactionSummaryDto {

    private Map<ReactionType, Long> counts;
    private ReactionType myReaction;

    public ReactionSummaryDto(
            Map<ReactionType, Long> counts,
            ReactionType myReaction
    ) {
        this.counts = counts;
        this.myReaction = myReaction;
    }

    public Map<ReactionType, Long> getCounts() {
        return counts;
    }

    public ReactionType getMyReaction() {
        return myReaction;
    }
}
