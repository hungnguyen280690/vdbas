package com.fis.vdbas.common.autoconfigure;

import com.fis.vdbas.common.config.CacheConfig;
import com.fis.vdbas.common.config.JpaConfig;
import com.fis.vdbas.common.security.SecurityConfig;
import com.fis.vdbas.common.web.GlobalExceptionHandler;
import com.fis.vdbas.common.web.LoggingInterceptor;
import com.fis.vdbas.common.web.WebMvcConfig;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

/**
 * Root auto-configuration for the VDBAS Common library.
 *
 * <p>Activated automatically when the library is on the classpath.
 * Individual beans are guarded by {@code @ConditionalOnMissingBean} — override
 * any of them by declaring your own bean of the same type.</p>
 *
 * <p>Message keys used by {@link GlobalExceptionHandler} are supplied in
 * {@code vdbas_common_messages*.properties}. Add it to your project's
 * {@code spring.messages.basename} (comma-separated) so the handler can
 * resolve generic error messages:</p>
 * <pre>
 * spring:
 *   messages:
 *     basename: messages, vdbas_common_messages
 * </pre>
 */
@AutoConfiguration
@ConditionalOnWebApplication
@Import({
    GlobalExceptionHandler.class,
    WebMvcConfig.class,
    JpaConfig.class,
    CacheConfig.class,
    SecurityConfig.class
})
public class VdbasCommonAutoConfiguration {

    @Bean
    public LoggingInterceptor loggingInterceptor() {
        return new LoggingInterceptor();
    }
}
