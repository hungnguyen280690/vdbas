package com.fis.vdbas.qtdc.application.administrative.servcie;

import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeTransformationDto;
import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeUnitDto;
import com.fis.vdbas.qtdc.application.administrative.dto.AdministrativeUnitSearchDto;
import com.fis.vdbas.qtdc.application.administrative.mapper.AdministrativeUnitMapper;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeUnit;
import com.fis.vdbas.qtdc.domain.administrative.AdministrativeUnitRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.fis.vdbas.qtdc.common.CacheConstants;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;
import java.util.stream.Collectors;

/**
 * Service for managing Administrative Units business logic.
 * <p>
 * Handles operations such as searching, retrieving, creating, updating, and
 * soft-deleting administrative units. Integrates with {@link AdministrativeTransformationService}
 * to manage unit history and caching for performance.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdministrativeUnitService {

    private final AdministrativeUnitRepository repository;
    private final AdministrativeUnitMapper mapper;
    private final AdministrativeTransformationService administrativeTransformationService;

    /**
     * Searches for administrative units based on filter criteria.
     * <p>
     * Results are cached to improve performance for frequent lookups.
     * </p>
     *
     * @param criteria Filter parameters for the search
     * @return List of matching administrative unit DTOs
     */
    @Cacheable(value = CacheConstants.ADMINISTRATIVE_UNIT_CACHE, key = "#criteria")
    public List<AdministrativeUnitDto> search(AdministrativeUnitSearchDto criteria) {
        List<AdministrativeUnit> administrativeUnits = repository.findAll(this.filter(criteria),
                                                                          Sort.by(Sort.Direction.ASC, "unitCode"));
        return mapper.toDtoList(administrativeUnits);
    }

    /**
     * Retrieves details of a specific administrative unit including its transformation history.
     *
     * @param id Unit ID
     * @return DTO containing unit details and source unit IDs if any
     */
    @Cacheable(value = CacheConstants.ADMINISTRATIVE_UNIT_CACHE, key = "#id")
    public AdministrativeUnitDto get(UUID id) {
        AdministrativeUnitDto result = mapper.toDto(repository.findById(id).orElseThrow());
        if (result != null) {
            List<AdministrativeTransformationDto> transformations = administrativeTransformationService
                    .getAllSourceId(id);
            if (CollectionUtils.isEmpty(transformations)) {
                result.setSourceUnitIds(new ArrayList<>());
            } else {
                result.setSourceUnitIds(transformations.stream().map(AdministrativeTransformationDto::getSourceUnitId)
                                                .collect(Collectors.toList()));
                result.setTransformationType(transformations.get(0).getTransformationType());
                result.setEffectiveDate(transformations.get(0).getEffectiveDate());
            }
        }
        return result;
    }

    /**
     * Creates a new administrative unit and its transformation records.
     * <p>
     * Automatically sets the active status based on the end date and evicts the cache.
     * </p>
     *
     * @param input Data for the new unit
     * @return The created unit
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ADMINISTRATIVE_UNIT_CACHE, allEntries = true)
    public AdministrativeUnitDto create(AdministrativeUnitDto input) {
        AdministrativeUnit entity = mapper.toEntity(input);
        entity.setId(null);

        if (entity.getEndDate() == null || entity.getEndDate().isBefore(LocalDateTime.now())) {
            entity.setActive(FLAG_TRUE);
        } else {
            entity.setActive(FLAG_FALSE);
        }
        AdministrativeUnitDto result = mapper.toDto(repository.save(entity));
        if (input.getSourceUnitIds() != null) {
            administrativeTransformationService.updateAdministrativeTransformation(result.getId(),
                                                                                   input.getSourceUnitIds(), input.getTransformationType(), input.getDecisionNumber(),
                                                                                   input.getStartDate());
        }
        return result;
    }

    /**
     * Updates an existing administrative unit's information and transformations.
     *
     * @param id    Unit ID
     * @param input Updated data
     * @return The updated unit
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ADMINISTRATIVE_UNIT_CACHE, allEntries = true)
    public AdministrativeUnitDto update(UUID id, AdministrativeUnitDto input) {
        AdministrativeUnit existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        mapper.updateEntityFromDto(input, existing);
        if (input.getEndDate() != null && input.getEndDate().isBefore(LocalDateTime.now())) {
            existing.setActive(FLAG_FALSE);
        } else {
            existing.setActive(FLAG_TRUE);
        }
        AdministrativeUnitDto result = mapper.toDto(repository.save(existing));

        administrativeTransformationService.updateAdministrativeTransformation(id,
                                                                               input.getSourceUnitIds(), input.getTransformationType(), input.getDecisionNumber(),
                                                                               input.getStartDate());
        return result;
    }

    /**
     * Updates the active status of an administrative unit.
     *
     * @param id     Unit ID
     * @param active New active status
     * @return The updated unit
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ADMINISTRATIVE_UNIT_CACHE, allEntries = true)
    public AdministrativeUnitDto updateActive(UUID id, Boolean active) {
        AdministrativeUnit existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        repository.updateActive(id, mapper.booleanToInteger(active));
        return get(id);
    }

    /**
     * Performs a soft-delete on an administrative unit.
     *
     * @param id Unit ID to delete
     */
    @Transactional
    @CacheEvict(value = CacheConstants.ADMINISTRATIVE_UNIT_CACHE, allEntries = true)
    public void delete(UUID id) {
        AdministrativeUnit existing = repository.findById(id).filter(e -> FLAG_FALSE.equals(e.getDeleted())).orElseThrow();
        repository.softDelete(id);
    }

    private Specification<AdministrativeUnit> filter(AdministrativeUnitSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getUnitCode() != null && !criteria.getUnitCode().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("unitCode")), "%" + criteria.getUnitCode().toLowerCase() + "%"));
            }

            if (criteria.getUnitName() != null && !criteria.getUnitName().isBlank()) {
                predicates.add(
                        cb.like(cb.lower(root.get("unitName")), "%" + criteria.getUnitName().toLowerCase() + "%"));
            }

            if (criteria.getUnitLevel() != null) {
                predicates.add(cb.equal(root.get("unitLevel"), criteria.getUnitLevel()));
            }

            if (criteria.getParentId() != null) {
                predicates.add(cb.equal(root.get("parentId"), criteria.getParentId()));
            }

            if (criteria.getHasEndDate() != null) {
                predicates.add(cb.isNotNull(root.get("endDate")));
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
