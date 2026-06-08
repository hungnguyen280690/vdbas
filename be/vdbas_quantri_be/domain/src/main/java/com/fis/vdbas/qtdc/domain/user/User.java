package com.fis.vdbas.qtdc.domain.user;

import com.fis.vdbas.qtdc.common.enums.AuthSource;
import com.fis.vdbas.qtdc.common.enums.OwnerType;
import com.fis.vdbas.common.domain.AbstractAuditing;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.PersonProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
@ToString(exclude = { "ownerPerson", "ownerOrganization" })
@NoArgsConstructor
public class User extends AbstractAuditing<UUID> {

        @Id
        @GeneratedValue
        @Column(name = "id", nullable = false, updatable = false)
        private UUID id;

        @Override
        public UUID getId() {
                return this.id;
        }

        @Column(name = "username", nullable = false, unique = true, length = 50)
        private String username;

        @Column(name = "external_id", length = 255)
        private String externalId;

        @Enumerated(EnumType.STRING)
        @Column(name = "auth_source", length = 20)
        private AuthSource authSource;

        @Column(name = "owner_id", nullable = false)
        private UUID ownerId;

        @Enumerated(EnumType.STRING)
        @Column(name = "owner_type", length = 10)
        private OwnerType ownerType;

        @Column(name = "is_org_admin")
        @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
        private Integer isOrgAdmin = 0;

        @Column(name = "display_name", length = 255)
        private String displayName;

        @Column(name = "user_type", length = 20)
        private String userType;

        @Column(name = "status")
        private Integer status;

        @Column(name = "is_deleted", nullable = false)
        @org.hibernate.annotations.JdbcTypeCode(java.sql.Types.NUMERIC)
        private Integer deleted = 0;

        /**
         * Relationship to PersonProfile when owner_type = 'PERSON'.
         * Use Hibernate-specific @Where to filter by owner_type.
         * ID is still retrieved from the owner_id column, direct updates from association are not allowed.
         */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "owner_id", insertable = false, updatable = false)
        @org.hibernate.annotations.JoinFormula(value = "CASE WHEN owner_type = 'PERSON' THEN owner_id ELSE NULL END", referencedColumnName = "id")
        private PersonProfile ownerPerson;

        /**
         * Relationship to OrganizationProfile when owner_type = 'ORG'.
         */
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "owner_id", insertable = false, updatable = false)
        @org.hibernate.annotations.JoinFormula(value = "CASE WHEN owner_type = 'ORG' THEN owner_id ELSE NULL END", referencedColumnName = "id")
        private OrganizationProfile ownerOrganization;

}
