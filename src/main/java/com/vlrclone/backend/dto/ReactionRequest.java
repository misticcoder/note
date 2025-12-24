package com.vlrclone.backend.dto;

import com.vlrclone.backend.Enums.ReactionType;

public class ReactionRequest {

    private ReactionType reactionType;

    public ReactionType getReactionType() {
        return reactionType;
    }

    public void setReactionType(ReactionType reactionType) {
        this.reactionType = reactionType;
    }
}
