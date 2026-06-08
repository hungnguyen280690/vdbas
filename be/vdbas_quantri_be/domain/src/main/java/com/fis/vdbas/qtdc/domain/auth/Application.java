package com.fis.vdbas.qtdc.domain.auth;

import com.fis.vdbas.common.domain.AbstractAuditing;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.UUID;

@Entity
@Table(name = "applications")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class Application extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "app_code", unique = true, nullable = false, length = 50)
    private String appCode;

    @Column(name = "app_name", nullable = false, length = 255)
    private String appName;

    @Column(name = "app_url", length = 300)
    private String appUrl;

    @Column(name = "org_id")
    private UUID orgId;

    @Column(name = "client_id", length = 50)
    private String clientId;

    @Column(name = "client_secret", length = 255)
    private String clientSecret;

    @jakarta.persistence.Lob
    @Column(name = "admin_info")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CLOB)
    private String adminInfo;

    @jakarta.persistence.Lob
    @Column(name = "description")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CLOB)
    private String description;

    @Column(name = "is_active")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer active = 1;

    @Column(name = "is_deleted", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer deleted = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile organization;

}
