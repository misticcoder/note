package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.News;
import com.vlrclone.backend.repository.NewsRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/news")
public class NewsController {
    private final NewsRepository newsRepository;

    public NewsController(NewsRepository newsRepository) {
        this.newsRepository = newsRepository;
    }

    @GetMapping
    public List<News> getNews() {
        return newsRepository.findAll();
    }

    @PostMapping
    public News addNews(@RequestBody News news) {
        return newsRepository.save(news);
    }
}
