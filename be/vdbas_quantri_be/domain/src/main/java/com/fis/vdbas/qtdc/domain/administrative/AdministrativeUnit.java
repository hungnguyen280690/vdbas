package com.fis.vdbas.qtdc.domain.administrative;

import com.fis.vdbas.common.domain.AbstractAuditing;
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
@Table(name = "administrative_units")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class AdministrativeUnit extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "unit_code", nullable = false, length = 20)
    private String unitCode;

    @Column(name = "unit_name", nullable = false, length = 255)
    private String unitName;

    @Column(name = "unit_level", nullable = false)
    private Integer unitLevel;

    @Column(name = "unit_type", length = 50)
    private String unitType;

    @Column(name = "parent_id")
    private UUID parentId;

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
    private AdministrativeUnit parent;
}
