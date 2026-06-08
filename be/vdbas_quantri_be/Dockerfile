# Build stage
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Download và import SSL certificate của Nexus vào JVM
RUN apk add --no-cache openssl && \
    openssl s_client -connect ac-nexus.apps.ocp.vst.gov.vn:443 -showcerts </dev/null 2>/dev/null | \
    openssl x509 -outform PEM > /tmp/nexus.crt && \
    keytool -import -trustcacerts -noprompt \
    -alias nexus-cert \
    -file /tmp/nexus.crt \
    -keystore $JAVA_HOME/lib/security/cacerts \
    -storepass changeit

COPY pom.xml .
COPY api/ api/
COPY application/ application/
COPY common/ common/
COPY domain/ domain/

RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/api/target/*.jar app.jar

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENV JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC -XX:MaxGCPauseMillis=200"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]