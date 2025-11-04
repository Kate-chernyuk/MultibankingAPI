package org.vtb.multibanking.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.Map;

@Data
@Configuration
@EnableAsync
@EnableScheduling
@ConfigurationProperties(prefix = "bank")
public class BankConfig {
    private Map<String, BankApiConfig> apis;

    @Data
    public static class BankApiConfig {
        private String baseUrl;
        private String clientId;
        private String clientSecret;
    }
}