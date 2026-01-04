package com.vlrclone.backend.dto;

import java.time.LocalDateTime;
import java.util.Set;

public class EventListDto {

    public Long id;
    public String title;
    public String location;
    public String status;

    public double averageRating;
    public int ratingCount;
    public Integer myRating;

    public Long clubId;
    public String clubName;

    public Set<String> tags;
}
