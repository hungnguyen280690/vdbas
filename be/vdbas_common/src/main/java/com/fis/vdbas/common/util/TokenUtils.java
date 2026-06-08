package com.fis.vdbas.common.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

public final class TokenUtils {

    private TokenUtils() {
    }

    public static Optional<Jwt> getJwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            return Optional.of(jwt);
        }
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            return Optional.of(jwtAuth.getToken());
        }
        return Optional.empty();
    }

    /**
     * Returns the current user's preferred_username from JWT, or falls back to
     * {@link Authentication#getName()} for non-JWT auth (e.g. gateway X-User-Id).
     */
    public static Optional<String> getUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        // JWT path — prefer preferred_username claim
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            String username = jwtAuth.getToken().getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return Optional.of(username);
            }
            return Optional.ofNullable(jwtAuth.getToken().getSubject());
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String username = jwt.getClaimAsString("preferred_username");
            if (username != null && !username.isBlank()) {
                return Optional.of(username);
            }
            return Optional.ofNullable(jwt.getSubject());
        }
        // Non-JWT auth (e.g. GatewayAuthFilter sets principal = X-User-Id value)
        String name = auth.getName();
        return (name != null && !name.isBlank()) ? Optional.of(name) : Optional.empty();
    }

    public static Optional<String> getUserId() {
        Optional<String> userId = getJwt().map(Jwt::getSubject);
        if (userId.isPresent()) {
            return userId;
        }
        // Non-JWT auth (fallback to Authentication principal or X-User-Id header)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth.getPrincipal() instanceof Jwt)) {
            String name = auth.getName();
            if (name != null && !name.isBlank()) {
                return Optional.of(name);
            }
        }
        return getHeader("X-User-Id");
    }

    public static Optional<String> getEmail() {
        Optional<String> email = getClaim("email");
        if (email.isPresent()) {
            return email;
        }
        return getHeader("X-User-Email");
    }

    public static Optional<String> getName() {
        Optional<String> name = getClaim("name");
        if (name.isPresent()) {
            return name;
        }
        return getHeader("X-User-Name");
    }

    public static Optional<String> getClaim(String claimName) {
        return getJwt().map(jwt -> {
            Object claim = jwt.getClaim(claimName);
            return claim != null ? claim.toString() : null;
        });
    }

    public static Map<String, Object> getClaims() {
        return getJwt().map(Jwt::getClaims).orElse(null);
    }

    public static String getTokenValue() {
        return getJwt().map(Jwt::getTokenValue).orElse(null);
    }

    private static Optional<String> getHeader(String headerName) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            String headerValue = request.getHeader(headerName);
            if (headerValue != null && !headerValue.isBlank()) {
                return Optional.of(headerValue);
            }
        }
        return Optional.empty();
    }
}
