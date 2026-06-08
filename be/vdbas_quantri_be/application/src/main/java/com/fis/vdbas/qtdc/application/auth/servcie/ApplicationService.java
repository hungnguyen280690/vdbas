package com.fis.vdbas.qtdc.application.auth.servcie;

import com.fis.vdbas.qtdc.application.auth.dto.ApplicationDto;
import com.fis.vdbas.qtdc.application.auth.keycloak.servcie.KeycloakClientService;
import com.fis.vdbas.qtdc.application.auth.mapper.ApplicationMapper;
import com.fis.vdbas.qtdc.application.auth.dto.ApplicationSearchDto;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.domain.auth.Application;
import com.fis.vdbas.qtdc.domain.auth.ApplicationRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;

import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

/**
 * Service for processing business logic related to Application management.
 * <p>
 * In addition to storing application information in the local database, this service
 * also synchronizes data directly with Keycloak (creating Clients, updating Secrets, status)
 * to grant access through OAuth2.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApplicationService {

    private final ApplicationRepository repository;
    private final ApplicationMapper mapper;
    private final KeycloakClientService keycloakClientService;

    /**
     * Retrieves a list of all active (active = true) and non-deleted (deleted = false) applications.
     * Primarily used for dropdowns/comboboxes on the user interface.
     *
     * @return A list of lightweight application DTOs
     */
    public List<ApplicationDto> findAll() {
        return mapper.toComboboxDto(repository.findByActiveTrueAndDeletedFalse());
    }

    /**
     * Searches for applications with pagination and applied filters.
     *
     * @param criteria Search criteria (appCode, appName, clientId, status, etc.)
     * @return Paginated results containing the matching applications
     */
    public PageResponseDto<ApplicationDto> search(ApplicationSearchDto criteria) {

        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "appCode";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<Application> page = repository.findAll(this.filter(criteria), pageable);

        PageResponseDto<ApplicationDto> response = PageResponseDto.<ApplicationDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
        return response;
    }

    /**
     * Retrieves detailed information of a specific application.
     *
     * @param id The primary key of the application
     * @return Detailed DTO information of the application, throws an exception if not found
     */
    public ApplicationDto get(UUID id) {
        return mapper.toDto(repository.findById(id).orElseThrow());
    }

    /**
     * Creates a new application.
     * <p>
     * Step 1: Calls KeycloakClientService to create a new Client on the SSO system (Keycloak).
     * Step 2: Saves application information (including clientId, clientSecret generated from Keycloak) to the DB.
     * </p>
     *
     * @param input Application data from the request
     * @return Successfully created application information
     */
    @Transactional
    public ApplicationDto create(ApplicationDto input) {

        // 1. Create client on Keycloak
        String secret = keycloakClientService.createClient(input.getClientId(), input.getAppName(),
                input.getClientSecret());

        // 2. Save to local database
        Application entity = mapper.toEntity(input);
        entity.setClientId(input.getClientId());
        entity.setClientSecret(secret);

        if (input.getActive() == null) {
            entity.setActive(FLAG_TRUE);
        }

        ApplicationDto result = mapper.toDto(repository.save(entity));
        if (log.isDebugEnabled()) {
            log.debug("create result id: {}, clientId: {}", result.getId(), result.getClientId());
        }
        return result;
    }

    /**
     * Updates application information.
     * <p>
     * If there is a change in the clientSecret, the system will synchronize the new password
     * to Keycloak to ensure consistency.
     * </p>
     *
     * @param id    Application primary key
     * @param input Updated data
     * @return Saved application information
     */
    @Transactional
    public ApplicationDto update(UUID id, ApplicationDto input) {

        Application existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();

        // Sync clientSecret to Keycloak if it has changed
        if (StringUtils.hasLength(input.getClientSecret())
                && !input.getClientSecret().equals(existing.getClientSecret())) {
            keycloakClientService.updateClient(existing.getClientId(), input.getAppName(), input.getClientSecret());
        }

        mapper.updateEntityFromDto(input, existing);
        return mapper.toDto(repository.save(existing));
    }

    /**
     * Changes the active status of an application.
     * <p>
     * Automatically synchronizes the status (Enable/Disable) to the corresponding Client on Keycloak.
     * </p>
     *
     * @param id     Application primary key
     * @param active Desired status (true: active, false: disabled)
     * @return Application information with the new status
     */
    @Transactional
    public ApplicationDto updateActive(UUID id, Boolean active) {

        Application existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();

        // Sync with Keycloak if appCode or appName or active changes
        keycloakClientService.updateClientStatus(existing.getClientId(), active);
        repository.updateActive(id, mapper.booleanToInteger(active));

        existing.setActive(mapper.booleanToInteger(active));
        return mapper.toDto(existing);
    }

    /**
     * Performs a soft-delete on an application from the system.
     * <p>
     * Instead of deleting the record, the deleted field is set to true. Additionally,
     * the corresponding Client on Keycloak will be disabled.
     * </p>
     *
     * @param id Application primary key
     */
    @Transactional
    public void delete(UUID id) {

        Application existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        // Sync with Keycloak if appCode or appName or active changes
        keycloakClientService.updateClientStatus(existing.getClientId(), false);
        repository.softDelete(id);
    }

    private Specification<Application> filter(ApplicationSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getAppCode() != null && !criteria.getAppCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("appCode")), "%" + criteria.getAppCode().toLowerCase() + "%"));
            }

            if (criteria.getAppName() != null && !criteria.getAppName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("appName")), "%" + criteria.getAppName().toLowerCase() + "%"));
            }

            if (criteria.getOrgId() != null) {
                predicates.add(cb.equal(root.get("orgId"), criteria.getOrgId()));
            }

            if (criteria.getClientId() != null && !criteria.getClientId().isBlank()) {
                predicates
                        .add(cb.like(cb.lower(root.get("clientId")), "%" + criteria.getClientId().toLowerCase() + "%"));
            }

            if (criteria.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), mapper.booleanToInteger(criteria.getActive())));
            }

            if (criteria.getDeleted() != null) {
                predicates.add(cb.equal(root.get("deleted"), mapper.booleanToInteger(criteria.getDeleted())));
            } else {
                predicates.add(cb.equal(root.get("deleted"), FLAG_FALSE));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

}
