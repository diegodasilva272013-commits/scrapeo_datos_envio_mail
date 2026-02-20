import cron from 'node-cron'

interface ScheduledJob {
  cronExpression: string
  task: () => Promise<void>
  label: string
}

const jobs: Map<string, cron.ScheduledTask> = new Map()

export function scheduleJob(id: string, job: ScheduledJob) {
  // Detener job anterior si existe
  stopJob(id)

  if (!cron.validate(job.cronExpression)) {
    console.error(`[Scheduler] Expresión cron inválida para ${id}: ${job.cronExpression}`)
    return
  }

  const task = cron.schedule(job.cronExpression, async () => {
    console.log(`[Scheduler] Ejecutando: ${job.label}`)
    try {
      await job.task()
    } catch (err) {
      console.error(`[Scheduler] Error en ${job.label}:`, err)
    }
  })

  jobs.set(id, task)
  console.log(`[Scheduler] Registrado: ${job.label} → ${job.cronExpression}`)
}

export function stopJob(id: string) {
  const existing = jobs.get(id)
  if (existing) {
    existing.stop()
    jobs.delete(id)
  }
}

export function stopAll() {
  jobs.forEach((task) => task.stop())
  jobs.clear()
}

// Helpers para construir expresiones cron desde la UI
export function buildCronExpression(hour: number, minute = 0, days: number[] = [1, 2, 3, 4, 5]): string {
  // days: 0=dom, 1=lun, ..., 6=sab
  const daysStr = days.join(',')
  return `${minute} ${hour} * * ${daysStr}`
}
