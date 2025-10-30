package org.vtb.multibanking.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Data
@Configuration
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