package com.fis.vdbas.common.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
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
import tools.jackson.databind.DefaultTyping;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.cfg.DateTimeFeature;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import tools.jackson.databind.jsontype.PolymorphicTypeValidator;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Cache infrastructure — provides a Caffeine (memory) or Redis CacheManager
 * based on {@code app.cache.type} property (default: {@code memory}).
 *
 * <p>Consuming projects register their cache names in their own
 * {@code CacheConstants} class and annotate service methods with
 * {@code @Cacheable}/@{@code @CacheEvict} as usual. No pre-registration
 * is needed here — both managers create caches on demand.</p>
 *
 * <p>Override by declaring your own {@link CacheManager} bean.</p>
 */
@Configuration
public class CacheConfig {

    @Value("${app.cache.default-ttl:15}")
    private long defaultTtl;

    /**
     * Allowed package prefix for Redis type-safe deserialization.
     * Set {@code app.cache.redis.allowed-package-prefix} in your application config.
     */
    @Value("${app.cache.redis.allowed-package-prefix:com.fis.}")
    private String allowedPackagePrefix;

    @Bean
    @ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
    @ConditionalOnMissingBean(RedisConnectionFactory.class)
    public RedisConnectionFactory redisConnectionFactory(
            @Value("${spring.data.redis.host}") String host,
            @Value("${spring.data.redis.port}") int port,
            @Value("${spring.data.redis.password:}") String password) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(host, port);
        if (password != null && !password.isBlank()) {
            config.setPassword(RedisPassword.of(password));
        }
        return new LettuceConnectionFactory(config);
    }

    @Bean
    @Primary
    @ConditionalOnProperty(name = "app.cache.type", havingValue = "redis")
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType(allowedPackagePrefix)
                .allowIfSubType(allowedPackagePrefix)
                .allowIfBaseType("java.util.")
                .allowIfSubType("java.util.")
                .allowIfBaseType("java.time.")
                .allowIfSubType("java.time.")
                .build();

        ObjectMapper mapper = JsonMapper.builder()
                .activateDefaultTyping(ptv, DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY)
                .disable(DateTimeFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();

        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(defaultTtl))
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair
                                .fromSerializer(new GenericJacksonJsonRedisSerializer(mapper)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .transactionAware()
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.cache.type", havingValue = "memory", matchIfMissing = true)
    @ConditionalOnMissingBean(CacheManager.class)
    public CacheManager inMemoryCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(defaultTtl, TimeUnit.MINUTES)
                .maximumSize(1000));
        return cacheManager;
    }
}
