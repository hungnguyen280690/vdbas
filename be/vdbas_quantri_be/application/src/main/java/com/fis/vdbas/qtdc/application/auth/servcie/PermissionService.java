package com.fis.vdbas.qtdc.application.auth.servcie;

import com.fis.vdbas.qtdc.application.auth.dto.PermissionDto;
import com.fis.vdbas.qtdc.application.auth.dto.PermissionSearchDto;
import com.fis.vdbas.qtdc.application.auth.mapper.PermissionMapper;
import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.domain.auth.Permission;
import com.fis.vdbas.qtdc.domain.auth.PermissionId;
import com.fis.vdbas.qtdc.domain.auth.PermissionRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.jpa.domain.Specification;
import com.fis.vdbas.qtdc.common.CacheConstants;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fis.vdbas.qtdc.common.Constants;

import java.util.ArrayList;
import java.util.List;

/**
 * Service for processing business logic related to Permissions.
 * <p>
 * Provides functionality to view, add, edit, and delete permissions on the system.
 * Any changes related to permissions will automatically trigger cache eviction (CacheEvict)
 * to apply the latest authorization configuration for users.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class PermissionService {

    private final PermissionRepository repository;
    private final PermissionMapper mapper;

    /**
     * Retrieves a list of all permissions currently in the system (regardless of appCode).
     *
     * @return List of permission DTOs
     */
    public List<PermissionDto> findAll() {
        return mapper.toDtoList(repository.findAll());
    }

    /**
     * Searches for permissions with pagination based on filter criteria.
     *
     * @param criteria Filter containing parameters such as permission code, name, type, and appCode
     * @return Paginated list of permissions satisfying the criteria
     */
    public PageResponseDto<PermissionDto> search(PermissionSearchDto criteria) {

        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "permissionCode";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<Permission> page = repository.findAll(this.filter(criteria), pageable);

        PageResponseDto<PermissionDto> response = PageResponseDto.<PermissionDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
        return response;
    }

    /**
     * Retrieves all permissions of a specific application, sorted by permissionCode in ascending order.
     *
     * @param criteria Criteria containing the appCode to retrieve permissions for
     * @return List of permissions belonging to that application
     */
    public List<PermissionDto> getAll(PermissionSearchDto criteria) {

        List<Permission> permissions = repository.findAllByAppCodeOrderByPermissionCodeAsc(criteria.getAppCode());

        return mapper.toDtoList(permissions);
    }

    /**
     * Retrieves detailed information for a single permission.
     *
     * @param appCode        Application code
     * @param permissionCode Permission code
     * @return DTO containing permission information, throws an error if not found
     */
    public PermissionDto get(String appCode, String permissionCode) {
        PermissionId id = new PermissionId();
        id.setAppCode(appCode);
        id.setPermissionCode(permissionCode);
        return mapper.toDto(repository.findById(id).orElseThrow());
    }

    /**
     * Creates a new permission for an application.
     * <p>
     * The system will check for duplicate primary keys (appCode + permissionCode).
     * If already exists, a runtime exception will be thrown.
     * </p>
     *
     * @param input Permission information to be created
     * @return The created permission
     * @throws RuntimeException If the permission already exists
     */
    @Transactional
    public PermissionDto create(PermissionDto input) {

        PermissionId id = new PermissionId();
        id.setAppCode(input.getAppCode());
        id.setPermissionCode(input.getPermissionCode());

        if (repository.existsById(id)) {
            throw new RuntimeException(Constants.ErrorMessage.PERMISSION_EXISTS);
        }

        Permission entity = mapper.toEntity(input);
        return mapper.toDto(repository.save(entity));
    }

    /**
     * Updates information for an existing permission.
     * <p>
     * This operation will evict the user permissions cache ({@code USER_PERMISSIONS_CACHE}).
     * </p>
     *
     * @param appCode        Application code
     * @param permissionCode Permission code to be updated
     * @param input          New permission data
     * @return Permission after update
     */
    @Transactional
    @CacheEvict(value = CacheConstants.USER_PERMISSIONS_CACHE, allEntries = true)
    public PermissionDto update(String appCode, String permissionCode, PermissionDto input) {
        PermissionId id = new PermissionId();
        id.setAppCode(appCode);
        id.setPermissionCode(permissionCode);

        Permission existing = repository.findById(id).orElseThrow();
        mapper.updateEntityFromDto(input, existing);
        return mapper.toDto(repository.save(existing));
    }

    /**
     * Permanently deletes (hard-delete) a permission from the system.
     * <p>
     * This operation will evict the user permissions cache ({@code USER_PERMISSIONS_CACHE}).
     * </p>
     *
     * @param appCode        Application code
     * @param permissionCode Permission code to be deleted
     */
    @Transactional
    @CacheEvict(value = CacheConstants.USER_PERMISSIONS_CACHE, allEntries = true)
    public void delete(String appCode, String permissionCode) {
        PermissionId id = new PermissionId();
        id.setAppCode(appCode);
        id.setPermissionCode(permissionCode);
        repository.deleteById(id);
    }

    private Specification<Permission> filter(PermissionSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getAppCode() != null && !criteria.getAppCode().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("appCode")), "%" + criteria.getAppCode().toLowerCase() + "%"));
            }

            if (criteria.getPermissionCode() != null && !criteria.getPermissionCode().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("permissionCode")),
                                "%" + criteria.getPermissionCode().toLowerCase() + "%"));
            }

            if (criteria.getPermissionName() != null && !criteria.getPermissionName().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("permissionName")),
                                "%" + criteria.getPermissionName().toLowerCase() + "%"));
            }

            if (criteria.getPermissionNameEn() != null && !criteria.getPermissionNameEn().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("permissionNameEn")),
                                "%" + criteria.getPermissionNameEn().toLowerCase() + "%"));
            }

            if (criteria.getType() != null && !criteria.getType().isBlank()) {
                predicates.add(cb.equal(root.get("type"), criteria.getType()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
