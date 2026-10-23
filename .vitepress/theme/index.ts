// 沿用 BAT 站的結構：extends DefaultTheme、enhanceApp 註冊元件。
// 字體走 Google Fonts（Noto Sans TC、Martian Mono、Chiron Hei HK），所以用不打包 Inter 的 theme-without-fonts；
// Artifact 預覽包因此少 14 個字體檔（Artifact 有檔數限制）。
import DefaultTheme from 'vitepress/theme-without-fonts'
import type { Theme } from 'vitepress'
import AutonomyDial from './components/AutonomyDial.vue'
import BatLink from './components/BatLink.vue'
import BreakpointMap from './components/BreakpointMap.vue'
import CapabilityLevels from './components/CapabilityLevels.vue'
import CardTable from './components/CardTable.vue'
import CaseCard from './components/CaseCard.vue'
import CtDownload from './components/CtDownload.vue'
import DemoVideo from './components/DemoVideo.vue'
import EcosystemStack from './components/EcosystemStack.vue'
import EraTimeline from './components/EraTimeline.vue'
import FeatureGrid from './components/FeatureGrid.vue'
import GrowthLadder from './components/GrowthLadder.vue'
import HeroTower from './components/HeroTower.vue'
import LandingCheck from './components/LandingCheck.vue'
import LayerStack from './components/LayerStack.vue'
import LearningPath from './components/LearningPath.vue'
import MediaFigure from './components/MediaFigure.vue'
import MergeModes from './components/MergeModes.vue'
import QuestionFlow from './components/QuestionFlow.vue'
import ShellLoop from './components/ShellLoop.vue'
import StatsCounter from './components/StatsCounter.vue'
import TicketLife from './components/TicketLife.vue'
import TicketStates from './components/TicketStates.vue'
import VersionBadge from './components/VersionBadge.vue'
import VersionMatrix from './components/VersionMatrix.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('AutonomyDial', AutonomyDial)
    app.component('BatLink', BatLink)
    app.component('BreakpointMap', BreakpointMap)
    app.component('CapabilityLevels', CapabilityLevels)
    app.component('CardTable', CardTable)
    app.component('CaseCard', CaseCard)
    app.component('CtDownload', CtDownload)
    app.component('DemoVideo', DemoVideo)
    app.component('EcosystemStack', EcosystemStack)
    app.component('EraTimeline', EraTimeline)
    app.component('FeatureGrid', FeatureGrid)
    app.component('GrowthLadder', GrowthLadder)
    app.component('HeroTower', HeroTower)
    app.component('LandingCheck', LandingCheck)
    app.component('LayerStack', LayerStack)
    app.component('LearningPath', LearningPath)
    app.component('MediaFigure', MediaFigure)
    app.component('MergeModes', MergeModes)
    app.component('QuestionFlow', QuestionFlow)
    app.component('ShellLoop', ShellLoop)
    app.component('StatsCounter', StatsCounter)
    app.component('TicketLife', TicketLife)
    app.component('TicketStates', TicketStates)
    app.component('VersionBadge', VersionBadge)
    app.component('VersionMatrix', VersionMatrix)
  }
} satisfies Theme
