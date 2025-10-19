// hooks/useOrganizationData.ts
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../services/supabaseClient'

export function useOrganizationData() {
  const { user } = useAuth()
  const [currentOrganization, setCurrentOrganization] = useState(null)
  const [employees, setEmployees] = useState([])
  const [schedules, setSchedules] = useState({})
  const [vacations, setVacations] = useState({})
  const [holidays, setHolidays] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)

  // Carregar dados da organização ao fazer login
  useEffect(() => {
    if (user) {
      loadOrganizationData()
    }
  }, [user])

  const loadOrganizationData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // 1. Buscar organização do usuário
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)

      if (orgError) throw orgError

      let orgId = null
      if (organizations && organizations.length > 0) {
        orgId = organizations[0].id
        setCurrentOrganization(organizations[0])
      }

      if (orgId) {
        // 2. Carregar funcionários
        const { data: employeesData, error: empError } = await supabase
          .from('employees')
          .select('*')
          .eq('organization_id', orgId)

        if (!empError && employeesData) {
          const formattedEmployees = employeesData.map(emp => ({
            id: emp.id,
            name: emp.name,
            type: emp.employee_type,
            isManager: emp.is_manager,
            team: emp.team || '',
            officeDays: emp.office_days,
            workingHours: emp.working_hours,
            preferences: emp.preferences || {}
          }))
          setEmployees(formattedEmployees)
        }

        // 3. Carregar escalas
        const { data: schedulesData, error: schedError } = await supabase
          .from('schedules')
          .select('*')
          .eq('organization_id', orgId)

        if (!schedError && schedulesData) {
          const formattedSchedules = {}
          schedulesData.forEach(schedule => {
            if (!formattedSchedules[schedule.employee_id]) {
              formattedSchedules[schedule.employee_id] = {}
            }
            formattedSchedules[schedule.employee_id][schedule.date] = schedule.status
          })
          setSchedules(formattedSchedules)
        }

        // 4. Carregar férias
        const { data: vacationsData, error: vacError } = await supabase
          .from('vacations')
          .select('*')
          .eq('organization_id', orgId)

        if (!vacError && vacationsData) {
          const formattedVacations = {}
          vacationsData.forEach(vacation => {
            formattedVacations[vacation.employee_id] = {
              start: vacation.start_date,
              end: vacation.end_date
            }
          })
          setVacations(formattedVacations)
        }

        // 5. Carregar feriados
        const { data: holidaysData, error: holError } = await supabase
          .from('holidays')
          .select('*')
          .eq('organization_id', orgId)

        if (!holError && holidaysData) {
          const formattedHolidays = {}
          holidaysData.forEach(holiday => {
            formattedHolidays[holiday.date] = {
              active: true,
              staff: holiday.staff_ids || []
            }
          })
          setHolidays(formattedHolidays)
        }

        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveAllData = async () => {
    if (!user) return { success: false, error: 'Usuário não logado' }

    setSaving(true)
    try {
      let orgId = currentOrganization?.id

      // 1. Criar organização se não existir
      if (!orgId) {
        const { data: newOrg, error: orgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Minha Organização',
            description: 'Sistema de Escalas',
            owner_id: user.id,
            settings: {}
          })
          .select()
          .single()

        if (orgError) throw orgError
        orgId = newOrg.id
        setCurrentOrganization(newOrg)
      }

      // 2. Salvar funcionários
      if (employees.length > 0) {
        // Limpar funcionários existentes
        await supabase
          .from('employees')
          .delete()
          .eq('organization_id', orgId)

        // Inserir funcionários atuais
        const employeesToInsert = employees.map(emp => ({
          id: emp.id, // Manter o ID para consistência
          organization_id: orgId,
          name: emp.name,
          employee_type: emp.type,
          is_manager: emp.isManager,
          team: emp.team,
          office_days: emp.officeDays,
          working_hours: emp.workingHours,
          preferences: emp.preferences
        }))

        const { error: empError } = await supabase
          .from('employees')
          .upsert(employeesToInsert)

        if (empError) throw empError
      }

      // 3. Salvar escalas
      const schedulesToSave = []
      Object.entries(schedules).forEach(([employeeId, employeeSchedules]) => {
        Object.entries(employeeSchedules).forEach(([date, status]) => {
          if (status) {
            schedulesToSave.push({
              organization_id: orgId,
              employee_id: employeeId,
              date,
              status
            })
          }
        })
      })

      if (schedulesToSave.length > 0) {
        // Limpar escalas existentes do período
        const dates = [...new Set(schedulesToSave.map(s => s.date))]
        await supabase
          .from('schedules')
          .delete()
          .eq('organization_id', orgId)
          .in('date', dates)

        // Inserir novas escalas
        const { error: schedError } = await supabase
          .from('schedules')
          .insert(schedulesToSave)

        if (schedError) throw schedError
      }

      // 4. Salvar férias
      const vacationsToSave = Object.entries(vacations).map(([employeeId, vacation]) => ({
        organization_id: orgId,
        employee_id: employeeId,
        start_date: vacation.start,
        end_date: vacation.end
      }))

      if (vacationsToSave.length > 0) {
        // Limpar férias existentes
        await supabase
          .from('vacations')
          .delete()
          .eq('organization_id', orgId)

        // Inserir novas férias
        const { error: vacError } = await supabase
          .from('vacations')
          .insert(vacationsToSave)

        if (vacError) throw vacError
      }

      // 5. Salvar feriados
      const holidaysToSave = Object.entries(holidays).map(([date, holiday]) => ({
        organization_id: orgId,
        date,
        name: `Feriado ${date}`,
        staff_ids: holiday.staff || []
      }))

      if (holidaysToSave.length > 0) {
        // Limpar feriados existentes
        await supabase
          .from('holidays')
          .delete()
          .eq('organization_id', orgId)

        // Inserir novos feriados
        const { error: holError } = await supabase
          .from('holidays')
          .insert(holidaysToSave)

        if (holError) throw holError
      }

      setLastSaved(new Date())
      return { success: true }

    } catch (error) {
      console.error('Erro ao salvar:', error)
      return { success: false, error: error.message }
    } finally {
      setSaving(false)
    }
  }

  return {
    // Estados
    currentOrganization,
    employees,
    schedules,
    vacations,
    holidays,
    loading,
    saving,
    lastSaved,
    
    // Setters para o ScheduleApp usar
    setEmployees,
    setSchedules,
    setVacations,
    setHolidays,
    
    // Ações
    saveAllData,
    loadOrganizationData
  }
}