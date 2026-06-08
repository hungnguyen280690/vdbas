package com.fis.vdbas.qtdc.domain.profile;

import com.fis.vdbas.common.domain.AbstractAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.UUID;

@Entity
@Table(name = "person_profiles")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class PersonProfile extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "email", length = 250)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "identity_number", length = 20)
    private String identityNumber;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "is_internal", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer internal = 0;

    @Column(name = "is_active", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer active = 1;

    @Column(name = "is_deleted", nullable = false)
    @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
    private Integer deleted = 0;
}
