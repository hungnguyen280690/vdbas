package com.fis.vdbas.qtdc.api.config;

import com.fis.vdbas.qtdc.common.CacheConstants;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.cfg.DateTimeFeature;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import tools.jackson.databind.jsontype.PolymorphicTypeValidator;
import tools.jackson.databind.DefaultTyping;

import org.springframework.beans.factory.annotation.Value;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
public class CacheConfig {

        @Value("${app.cache.default-ttl:15}")
        private long defaultTtl;

        private static final String ALLOWED_PACKAGE_PREFIX = "com.fis.vdbas.qtdc.";
        private static final String JAVA_UTIL_PACKAGE = "java.util.";
        private static final String JAVA_TIME_PACKAGE = "java.time.";

        @Bean
        @ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
        public RedisConnectionFactory redisConnectionFactory(
                        @Value("${spring.data.redis.host}") String host,
                        @Value("${spring.data.redis.port}") int port,
                        @Value("${spring.data.redis.password}") String password) {
                RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
                if (password != null && !password.isBlank()) {
                        config.setPassword(RedisPassword.of(password));
                }
                return new LettuceConnectionFactory(config);
        }

        @Bean
        @Primary
        @ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
        public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
                PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                                .allowIfBaseType(ALLOWED_PACKAGE_PREFIX)
                                .allowIfSubType(ALLOWED_PACKAGE_PREFIX)
                                .allowIfBaseType(JAVA_UTIL_PACKAGE)
                                .allowIfSubType(JAVA_UTIL_PACKAGE)
                                .allowIfBaseType(JAVA_TIME_PACKAGE)
                                .allowIfSubType(JAVA_TIME_PACKAGE)
                                .build();

                ObjectMapper mapper = JsonMapper.builder()
                                .activateDefaultTyping(ptv, DefaultTyping.NON_FINAL,
                                                JsonTypeInfo.As.PROPERTY)
                                .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
                                .build();

                GenericJacksonJsonRedisSerializer serializer = new GenericJacksonJsonRedisSerializer(mapper);

                RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(defaultTtl))
                                .disableCachingNullValues()
                                .serializeKeysWith(
                                                RedisSerializationContext.SerializationPair
                                                                .fromSerializer(new StringRedisSerializer()))
                                .serializeValuesWith(RedisSerializationContext.SerializationPair
                                                .fromSerializer(serializer));

                return RedisCacheManager.builder(connectionFactory)
                                .cacheDefaults(config)
                                .initialCacheNames(java.util.Set.of(
                                                CacheConstants.USER_PERMISSIONS_CACHE,
                                                CacheConstants.ADMINISTRATIVE_UNIT_CACHE,
                                                CacheConstants.ORGANIZATION_CACHE))
                                .transactionAware()
                                .build();
        }

        @Bean
        @ConditionalOnProperty(name = "app.cache.type", havingValue = "memory", matchIfMissing = true)
        public CacheManager inMemoryCacheManager() {
                CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                                CacheConstants.USER_PERMISSIONS_CACHE,
                                CacheConstants.ADMINISTRATIVE_UNIT_CACHE,
                                CacheConstants.ORGANIZATION_CACHE);
                cacheManager.setCaffeine(Caffeine.newBuilder()
                                .expireAfterWrite(defaultTtl, TimeUnit.MINUTES)
                                .maximumSize(1000));
                return cacheManager;
        }
}
