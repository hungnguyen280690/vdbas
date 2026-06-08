package com.fis.vdbas.common.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.ModelAndView;

import java.util.UUID;

/**
 * HTTP-level logging interceptor — active only when the logger is set to DEBUG.
 *
 * <p>Centralises request/response logging across all VDBAS services.
 * Both {@link #preHandle} and {@link #afterCompletion} short-circuit
 * when DEBUG is disabled, producing zero overhead in production.</p>
 *
 * <p>Registered via {@link WebMvcConfig} for {@code /api/**} paths.</p>
 */
@Slf4j
public class LoggingInterceptor implements HandlerInterceptor {

    private static final String START_TIME_ATTR = LoggingInterceptor.class.getName() + ".startTime";
    private static final String REQUEST_ID_ATTR = LoggingInterceptor.class.getName() + ".requestId";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!log.isDebugEnabled()) {
            return true;
        }

        long startTime = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString().replace("-", "").substring(0, 12);

        request.setAttribute(START_TIME_ATTR, startTime);
        request.setAttribute(REQUEST_ID_ATTR, requestId);
        response.setHeader("X-Request-ID", requestId);

        String query = request.getQueryString() != null ? "?" + request.getQueryString() : "";
        log.debug("[{}] --> {} {}{} | user={}",
                requestId, request.getMethod(), request.getRequestURI(), query, resolveUsername());

        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response,
            Object handler, ModelAndView modelAndView) {
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
            Object handler, Exception ex) {
        if (!log.isDebugEnabled()) {
            return;
        }

        long elapsed = computeElapsed(request);
        String requestId = (String) request.getAttribute(REQUEST_ID_ATTR);
        int status = response.getStatus();

        if (ex != null || status >= 500) {
            log.debug("[{}] <-- {} {} | status={} | elapsed={}ms | error={}",
                    requestId, request.getMethod(), request.getRequestURI(), status, elapsed,
                    ex != null ? ex.getMessage() : "server error");
        } else {
            log.debug("[{}] <-- {} {} | status={} | elapsed={}ms",
                    requestId, request.getMethod(), request.getRequestURI(), status, elapsed);
        }
    }

    // ─── Private ───────────────────────────────────────────────────────────────

    private String resolveUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return "anonymous";
            }
            Object principal = auth.getPrincipal();
            if (principal instanceof Jwt jwt) {
                String username = jwt.getClaimAsString("preferred_username");
                return username != null ? username : jwt.getSubject();
            }
            return auth.getName();
        } catch (Exception e) {
            return "unknown";
        }
    }

    private long computeElapsed(HttpServletRequest request) {
        Object startAttr = request.getAttribute(START_TIME_ATTR);
        if (startAttr instanceof Long startTime) {
            return System.currentTimeMillis() - startTime;
        }
        return -1L;
    }
}
