package com.vlrclone.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class EventUpdateDto {
    public String title;
    public String content;
    public String location;
    public LocalDateTime startAt;
    public LocalDateTime endAt;
    public List<String> tags;


}
