package com.fis.vdbas.qtdc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(excludeName = {
        "org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration",
        "org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration",
        "org.springframework.boot.actuate.autoconfigure.data.redis.RedisHealthContributorAutoConfiguration" })
@EnableCaching
@EnableScheduling
@EnableJpaRepositories(basePackages = "com.fis.vdbas.qtdc.domain")
@EntityScan(basePackages = "com.fis.vdbas.qtdc.domain")
public class VdbasQtttApplication {

    public static void main(String[] args) {
        SpringApplication.run(VdbasQtttApplication.class, args);
    }
}
