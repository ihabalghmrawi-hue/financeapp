import type { ModuleConfig } from './types'
export type { ModuleConfig, BusinessModuleConfig } from './types'

import { pharmacy as _pharmacy } from './pharmacy'
import { retail as _retail } from './retail'
import { wholesale as _wholesale } from './wholesale'
import { clothing as _clothing } from './clothing'
import { stationery as _stationery } from './stationery'
import { tools as _tools } from './tools'
import { atelier as _atelier } from './atelier'
import { suits as _suits } from './suits'
import { other as _other } from './other'

export const pharmacy = _pharmacy
export const retail = _retail
export const wholesale = _wholesale
export const clothing = _clothing
export const stationery = _stationery
export const tools = _tools
export const atelier = _atelier
export const suits = _suits
export const other = _other

export const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  pharmacy: _pharmacy,
  retail: _retail,
  wholesale: _wholesale,
  clothing: _clothing,
  stationery: _stationery,
  tools: _tools,
  atelier: _atelier,
  suits: _suits,
  other: _other,
}
