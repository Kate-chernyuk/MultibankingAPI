package org.vtb.multibanking.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;
import org.vtb.multibanking.service.GOSTBankClient;

import java.util.Map;

@Data
@Configuration
@ConfigurationProperties(prefix = "gost")
public class GOSTBankClientConfig {

    private BankGOSTApiConfig api;

    @Data
    public static class BankGOSTApiConfig {
        private String clientId;
        private String clientSecret;
        private String gostBaseUrl;
        private String authUrl;
    }

    @Bean
    public GOSTBankClient gostBankClient() {
        return new GOSTBankClient(this);
    }
}