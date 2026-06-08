package com.fis.vdbas.qtdc.domain.profile;

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

import java.time.LocalDate;
import java.util.UUID;

import com.fis.vdbas.common.domain.AbstractAuditingCreate;

@Entity
@Table(name = "organization_person")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class OrganizationPerson extends AbstractAuditingCreate<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "person_id", nullable = false)
    private UUID personId;

    @Column(name = "org_id", nullable = false)
    private UUID orgId;

    @Column(name = "position_name", length = 255)
    private String positionName;

    @Column(name = "position_code", length = 255)
    private String positionCode;

    @Column(name = "is_main")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer main = 1;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate = LocalDate.now();

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active")
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer active = 1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "person_id", referencedColumnName = "id", insertable = false, updatable = false)
    private PersonProfile person;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "org_id", referencedColumnName = "id", insertable = false, updatable = false)
    private OrganizationProfile organization;
}
