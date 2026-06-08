package com.fis.vdbas.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

/**
 * Security filter for the IBM DataPower Gateway integration.
 *
 * <p>Responsibilities:
 * <ol>
 *   <li>Validates the {@code X-Internal-Token} shared-secret to ensure the request
 *       was forwarded by the gateway and not sent directly by an external caller.</li>
 *   <li>Extracts {@code X-User-Id} (injected by the gateway after Keycloak token
 *       verification) and sets it as the Spring Security principal.</li>
 * </ol>
 *
 * <p><b>Dev mode:</b> if {@code app.gateway.internal-token} is blank (default),
 * the token check is skipped so developers can call the service directly.
 * Always set the token in production.
 */
@Slf4j
public class GatewayAuthFilter extends OncePerRequestFilter {

    public static final String HEADER_INTERNAL_TOKEN = "X-Internal-Token";
    public static final String HEADER_USER_ID = "X-User-Id";

    private static final String API_PATH_PREFIX = "/api/";

    private final String expectedInternalToken;

    public GatewayAuthFilter(String expectedInternalToken) {
        this.expectedInternalToken = expectedInternalToken != null ? expectedInternalToken.trim() : "";
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!path.startsWith(API_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Validate shared-secret (skip in dev mode when token is blank)
        if (!expectedInternalToken.isBlank()) {
            String receivedToken = request.getHeader(HEADER_INTERNAL_TOKEN);
            if (!expectedInternalToken.equals(receivedToken)) {
                log.warn("Blocked direct request to [{}] — missing or invalid {}", path, HEADER_INTERNAL_TOKEN);
                writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                        "Request must be forwarded through the API Gateway.");
                return;
            }
        }

        // Extract X-User-Id injected by the gateway after JWT verification
        String userId = request.getHeader(HEADER_USER_ID);
        if (userId == null || userId.isBlank()) {
            log.warn("Request to [{}] is missing the {} header", path, HEADER_USER_ID);
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED,
                    "Missing required header: " + HEADER_USER_ID);
            return;
        }

        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(userId, null, Collections.emptyList()));

        if (log.isDebugEnabled()) {
            log.debug("Gateway auth OK — user [{}] → [{} {}]", userId, request.getMethod(), path);
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"error\":\"UNAUTHORIZED\",\"message\":\"" + message + "\"}");
    }
}
