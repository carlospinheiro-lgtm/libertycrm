

# Seed Data Plan — Realistic Portuguese Test Data

## Overview

Insert realistic Portuguese seed data across all DB-backed CRM modules. The Processos (CRM Processual) page currently uses hardcoded sample data and is not backed by a database table, so it will be skipped.

## Data to Insert

### 1. CRM Compradores — 15 leads (lead_type = 'buyer')

Distribution across columns:
- 2x `new` (Novo Contacto)
- 2x `first-contact` (Primeiro Contacto)
- 2x `qualifying` (Em Qualificacao)
- 2x `visits` (Visitas Agendadas)
- 2x `proposal` (Proposta Apresentada)
- 1x `negotiation` (Em Negociacao)
- 1x `won` (Fechado - Ganhamos)
- 1x `followup-0-3` (Follow-up 0-3 Meses)
- 1x `no-interest` (Sem Interesse)
- 1x `disqualified` (Lead Desqualificada)

### 2. CRM Vendedores — 12 leads (lead_type = 'seller')

Distribution across columns:
- 2x `new` (Novo Proprietario)
- 2x `first-contact` (Primeiro Contacto)
- 2x `meeting` (Reuniao Captacao)
- 2x `evaluation` (Em Avaliacao)
- 2x `proposal-sent` (Proposta Enviada)
- 1x `decision` (Em Decisao)
- 1x `signed` (Fechado - Ganhamos)

### 3. CRM Angariacoes — 6 property records

Distribution across stages:
- 1x `documentos` (Recolha de Documentos)
- 2x `avaliacao` (Avaliacao)
- 1x `publicacao` (Publicacao)
- 1x `visitas` (Visitas)
- 1x `negociacao` (Negociacao)

Each property gets default checklist items for its current stage, with some items marked as completed to show progress.

### 4. CRM Recrutamento — 8 leads (lead_type = 'recruitment')

Distribution across columns:
- 2x `new` (Candidatura Recebida)
- 2x `interview-scheduled` (Entrevista Agendada)
- 1x `interview-done` (Entrevista Realizada)
- 1x `decision` (Em Avaliacao)
- 1x `training` (Proposta Enviada - maps to training column)
- 1x `active` (Integrado)

### 5. Activity Logs — 1-3 per lead

Each lead gets 1-3 `lead_activities` entries (types: call, email, note) with varied timestamps to trigger aging indicators.

### 6. CRM Processual — Skipped

The Processos page uses hardcoded `sampleProcesses` array, not a database table. No SQL insert needed.

## Data Characteristics

- **Agency:** Liberty Braga (`fbeac105-6278-442a-8986-ad56fb4f89e4`)
- **Agents (rotating):** 6 agents from existing user_agencies records
- **Names:** Common Portuguese names (Ana, Joao, Rui, Margarida, etc.)
- **Phones:** +351 9XX XXX XXX format
- **Emails:** firstname.lastname@gmail.com / @hotmail.com
- **Locations:** Braga, Porto, Guimaraes, Barcelos, Viana do Castelo
- **Sources:** Idealista, Imovirtual, Referral, Website, Redes Sociais, Walk-in
- **Priorities:** Mix of baixa, normal, alta, urgente
- **Aging:** `column_entered_at` varied from 1 to 25 days ago

## Technical Approach

Single SQL insert operation via the data insert tool containing:
1. INSERT INTO `leads` — 35 records (15 buyer + 12 seller + 8 recruitment)
2. INSERT INTO `lead_activities` — ~60-80 activity log entries
3. INSERT INTO `properties` — 6 records with references ANG-2026-0001 through 0006
4. INSERT INTO `property_checklist_items` — default checklist items per property/stage

No schema changes needed. All tables and columns already exist.

