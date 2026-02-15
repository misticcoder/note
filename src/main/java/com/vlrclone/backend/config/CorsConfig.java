package com.vlrclone.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("https://gregarious-crepe-7ed224.netlify.app",
                       "https://note123-rho.vercel.app",
                       "https://note-np63.onrender.com/",
                        "https://zygotic-modestia-note7263-fe9aa608.koyeb.app/",
                        "http://localhost:3000")

                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
