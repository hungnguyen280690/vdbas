package com.fis.vdbas.qtdc.application.common.util;

import com.fis.vdbas.qtdc.common.Constants;
import com.fis.vdbas.qtdc.common.enums.ManageScopeType;
import com.fis.vdbas.qtdc.common.enums.OwnerType;
import com.fis.vdbas.qtdc.domain.profile.OrganizationMngmtScope;
import com.fis.vdbas.qtdc.domain.profile.OrganizationMngmtScopeRepository;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPersonRepository;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfile;
import com.fis.vdbas.qtdc.domain.profile.OrganizationProfileRepository;
import com.fis.vdbas.qtdc.domain.user.User;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class ManagementScopeHelper {

    private final OrganizationPersonRepository organizationPersonRepository;
    private final OrganizationMngmtScopeRepository scopeRepository;
    private final OrganizationProfileRepository organizationRepository;

    public record UserOrgInfo(UUID realOrgId, String realOrgPath) {
    }

    public UserOrgInfo resolveUserOrgInfo(User currentUser) {
        UUID userRealOrgId = null;
        String userRealOrgPath = null;

        if (OwnerType.ORG.equals(currentUser.getOwnerType())) {
            userRealOrgId = currentUser.getOwnerId();
            if (currentUser.getOwnerOrganization() != null) {
                userRealOrgPath = currentUser.getOwnerOrganization().getPaths();
            }
        } else if (OwnerType.PERSON.equals(currentUser.getOwnerType())) {
            OrganizationPerson mainOrg = organizationPersonRepository
                    .findByPersonIdAndMainTrueAndActiveTrue(currentUser.getOwnerId())
                    .orElse(null);
            if (mainOrg != null && mainOrg.getOrganization() != null) {
                userRealOrgId = mainOrg.getOrgId();
                userRealOrgPath = mainOrg.getOrganization().getPaths();
            }
        }
        return new UserOrgInfo(userRealOrgId, userRealOrgPath);
    }

    public List<Predicate> getSecurityPredicates(UserOrgInfo orgInfo, CriteriaBuilder cb,
            Path<String> pathsPath, Path<UUID> orgIdPath, Path<String> orgTypePath) {
        List<Predicate> securityPredicates = new ArrayList<>();

        // 1. Own organization and subordinates
        if (orgInfo.realOrgPath() != null) {
            securityPredicates.add(cb.like(pathsPath, orgInfo.realOrgPath() + "%"));
        }

        // 2. Organization Management Scope configs
        if (orgInfo.realOrgId() != null) {
            List<OrganizationMngmtScope> scopes = scopeRepository.findByManagerOrgId(orgInfo.realOrgId());
            for (OrganizationMngmtScope config : scopes) {
                addScopeConfigPredicates(securityPredicates, config, cb, pathsPath, orgIdPath, orgTypePath);
            }
        }
        return securityPredicates;
    }

    private void addScopeConfigPredicates(List<Predicate> securityPredicates, OrganizationMngmtScope config,
            CriteriaBuilder cb, Path<String> pathsPath, Path<UUID> orgIdPath, Path<String> orgTypePath) {
        if (config.getTargetOrgId() != null) {
            if (ManageScopeType.DIRECT == config.getManageScopeType()) {
                securityPredicates.add(cb.equal(orgIdPath, config.getTargetOrgId()));
            } else if (ManageScopeType.SUBTREE == config.getManageScopeType()) {
                String rootScopePath = organizationRepository.findPathsById(config.getTargetOrgId());
                if (rootScopePath != null) {
                    securityPredicates.add(cb.like(pathsPath, rootScopePath + "%"));
                }
            }
        }
        if (config.getTargetOrgType() != null) {
            securityPredicates.add(cb.equal(orgTypePath, config.getTargetOrgType()));
        }
    }

    public boolean hasManagementPermission(User currentUser, OrganizationProfile targetOrg) {
        // Superadmin bypass
        if (Constants.ADMIN_USERNAME.equals(currentUser.getUsername())) {
            return true;
        }

        UserOrgInfo orgInfo = resolveUserOrgInfo(currentUser);
        String targetOrgPath = targetOrg.getPaths();

        // 1. Direct Hierarchy Check
        if (targetOrgPath != null && orgInfo.realOrgPath() != null && targetOrgPath.startsWith(orgInfo.realOrgPath())) {
            return true;
        }

        // 2. Management Scope Check
        if (orgInfo.realOrgId() != null) {
            List<OrganizationMngmtScope> scopes = scopeRepository.findByManagerOrgId(orgInfo.realOrgId());
            for (OrganizationMngmtScope config : scopes) {
                if (checkScopeConfig(config, targetOrg)) {
                    return true;
                }
            }
        }

        // 3. Fallback: Own Org Check
        return targetOrg.getId().equals(orgInfo.realOrgId());
    }

    private boolean checkScopeConfig(OrganizationMngmtScope config, OrganizationProfile targetOrg) {
        if (config.getTargetOrgType() != null && config.getTargetOrgType().equals(targetOrg.getOrgType())) {
            return true;
        }
        if (config.getTargetOrgId() != null) {
            if (ManageScopeType.DIRECT == config.getManageScopeType()
                    && config.getTargetOrgId().equals(targetOrg.getId())) {
                return true;
            }
            if (ManageScopeType.SUBTREE == config.getManageScopeType()) {
                String rootScopePath = organizationRepository.findPathsById(config.getTargetOrgId());
                return targetOrg.getPaths() != null && targetOrg.getPaths().startsWith(rootScopePath);
            }
        }
        return false;
    }
}
