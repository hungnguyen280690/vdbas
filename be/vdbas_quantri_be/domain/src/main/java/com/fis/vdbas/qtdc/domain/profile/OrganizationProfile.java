package com.fis.vdbas.qtdc.domain.profile;

import com.fis.vdbas.common.domain.AbstractAuditing;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeUnit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "organization_profiles")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class OrganizationProfile extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "org_code", nullable = false, unique = true, length = 50)
    private String orgCode;

    @Column(name = "org_name", nullable = false, length = 255)
    private String orgName;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @jakarta.persistence.Lob
    @Column(name = "address")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.CLOB)
    private String address;

    @Column(name = "org_type", length = 50)
    private String orgType;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "unit_id")
    private UUID unitId;

    @Column(name = "paths")
    private String paths;

    @Column(name = "is_active")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer active = 1;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "is_deleted", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer deleted = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id", referencedColumnName = "id", insertable = false, updatable = false)
    private AdministrativeUnit administrativeUnit;
}
