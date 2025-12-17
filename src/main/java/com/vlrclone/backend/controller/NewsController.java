package com.vlrclone.backend.controller;

import com.vlrclone.backend.model.News;
import com.vlrclone.backend.repository.NewsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Objects;

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

    @GetMapping("/{newsId}")
    public ResponseEntity<?> one(@PathVariable("newsId") Long id) {
        return newsRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body(Map.of("message","News not found")));
    }

    @PostMapping
    public com.vlrclone.backend.model.News add(@RequestBody News news) {
        return newsRepository.save(news);
    }

    @PatchMapping("/{newsId}")
    public ResponseEntity<?> update(@PathVariable("newsId") Long id, @RequestBody Map<String,Object> body) {
        var opt = newsRepository.findById(id);
        if (opt.isEmpty()){return ResponseEntity.status(404).body(Map.of("message","News not found"));}
        var t = opt.get();
        if (body.containsKey("name")){
            t.setTitle(Objects.toString(body.get("name"), t.getTitle()));
        }
        if (body.containsKey("description")){
            t.setContent(Objects.toString(body.get("description"), t.getContent()));
        }
        newsRepository.save(t);
        return ResponseEntity.ok(Map.of("status", "updated", "newsId", t.getId(), "name", t.getTitle(),
                "description", t.getContent()));

    }


    @DeleteMapping("/{newsId}")
    public ResponseEntity<?> delete(@PathVariable("newsId") Long id) {
        if (!newsRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("message","News not found"));
        }
        newsRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status","success"));
    }

}
