package com.fis.vdbas.qtdc.application.profile.servcie;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationPersonDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationPersonSearchDto;
import com.fis.vdbas.qtdc.application.profile.mapper.OrganizationPersonMapper;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPerson;
import com.fis.vdbas.qtdc.domain.profile.OrganizationPersonRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import static com.fis.vdbas.common.util.Constants.FLAG_FALSE;
import static com.fis.vdbas.common.util.Constants.FLAG_TRUE;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationPersonService {

    private final OrganizationPersonRepository repository;
    private final OrganizationPersonMapper mapper;

    @Transactional(readOnly = true)
    public List<OrganizationPersonDto> findAll() {
        return mapper.toDtoList(repository.findAll());
    }

    @Transactional(readOnly = true)
    public PageResponseDto<OrganizationPersonDto> search(OrganizationPersonSearchDto criteria) {
        if (log.isDebugEnabled()) {
            log.debug("search organization persons by criteria: {}", criteria);
        }
        String sortBy = (criteria.getSortBy() != null && !criteria.getSortBy().isBlank())
                ? criteria.getSortBy()
                : "startDate";
        Direction direction = "desc".equalsIgnoreCase(criteria.getSortDirection())
                ? Direction.DESC
                : Direction.ASC;

        Pageable pageable = PageRequest.of(criteria.getPage(), criteria.getSize(), Sort.by(direction, sortBy));
        Page<OrganizationPerson> page = repository.findAll(this.filter(criteria), pageable);

        return PageResponseDto.<OrganizationPersonDto>builder()
                .content(mapper.toDtoList(page.getContent()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Transactional(readOnly = true)
    public OrganizationPersonDto get(UUID id) {
        return mapper.toDto(repository.findById(id).orElseThrow());
    }

    @Transactional
    public OrganizationPersonDto create(OrganizationPersonDto input) {
        OrganizationPerson entity = mapper.toEntity(input);
        entity.setId(null);
        return mapper.toDto(repository.save(entity));
    }

    @Transactional
    public OrganizationPersonDto update(UUID id, OrganizationPersonDto input) {
        OrganizationPerson existing = repository.findById(id).orElseThrow();
        mapper.updateEntityFromDto(input, existing);
        return mapper.toDto(repository.save(existing));
    }

    @Transactional
    public void delete(UUID id) {
        repository.deleteById(id);
    }

    private Specification<OrganizationPerson> filter(OrganizationPersonSearchDto criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria.getPersonId() != null) {
                predicates.add(cb.equal(root.get("personId"), criteria.getPersonId()));
            }

            if (criteria.getOrgId() != null) {
                predicates.add(cb.equal(root.get("orgId"), criteria.getOrgId()));
            }

            if (criteria.getPositionName() != null && !criteria.getPositionName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("positionName")),
                        "%" + criteria.getPositionName().toLowerCase() + "%"));
            }

            if (criteria.getMain() != null) {
                predicates.add(cb.equal(root.get("main"), mapper.booleanToInteger(criteria.getMain())));
            }

            if (criteria.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), mapper.booleanToInteger(criteria.getActive())));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
