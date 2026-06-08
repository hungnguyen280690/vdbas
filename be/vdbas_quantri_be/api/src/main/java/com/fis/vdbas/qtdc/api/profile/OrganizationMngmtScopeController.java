package com.fis.vdbas.qtdc.api.profile;

import com.fis.vdbas.common.dto.PageResponseDto;
import com.fis.vdbas.qtdc.application.profile.servcie.OrganizationMngmtScopeService;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationMngmtScopeDto;
import com.fis.vdbas.qtdc.application.profile.dto.OrganizationMngmtScopeSearchDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Controller for managing Organization Management Scopes.
 * <p>
 * Defines which organizations have the authority to manage other organizations,
 * establishing a hierarchical or scoped oversight relationship.
 * </p>
 */
@RestController
@RequestMapping("/api/org-mngmt-scopes")
@RequiredArgsConstructor
@Slf4j
public class OrganizationMngmtScopeController {

    private final OrganizationMngmtScopeService service;

    // @GetMapping
    // public List<OrganizationMngmtScopeDto> findAll(@RequestParam(required =
    // false) UUID managerOrgId) {
    // if (managerOrgId != null) {
    // return service.findByManagerOrgId(managerOrgId);
    // }
    // return service.findAll();
    // }

    /**
     * Searches for organization management scopes with pagination and filtering.
     *
     * @param body Search parameters
     * @return Paginated response of management scopes
     */
    @PostMapping("/search")
    public PageResponseDto<OrganizationMngmtScopeDto> search(@RequestBody OrganizationMngmtScopeSearchDto body) {
        return service.search(body);
    }

    /**
     * Retrieves details of a specific management scope.
     *
     * @param id Scope UUID
     * @return Scope details
     */
    @GetMapping("/{id}")
    public OrganizationMngmtScopeDto get(@PathVariable UUID id) {
        return service.get(id);
    }

    /**
     * Creates a new organization management scope.
     *
     * @param input Scope data
     * @return The created scope with HTTP 201 status
     */
    @PostMapping
    public ResponseEntity<OrganizationMngmtScopeDto> create(@RequestBody OrganizationMngmtScopeDto input) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(input));
    }



    /**
     * Updates an existing organization management scope.
     *
     * @param id    Scope UUID
     * @param input Updated scope data
     * @return The updated scope
     */
    @PutMapping("/{id}")
    public OrganizationMngmtScopeDto update(@PathVariable UUID id, @RequestBody OrganizationMngmtScopeDto input) {
        return service.update(id, input);
    }

    /**
     * Deletes an organization management scope.
     *
     * @param id Scope UUID to delete
     * @return HTTP 204 status on success
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
