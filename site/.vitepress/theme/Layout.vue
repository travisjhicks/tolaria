<script setup lang="ts">
import DefaultTheme from "vitepress/theme";
import { onBeforeUnmount, onMounted } from "vue";
import { useData } from "vitepress";

const { frontmatter } = useData();

const scrollClass = "tolaria-scrolled";
const updateScrollClass = () => {
  document.documentElement.classList.toggle(scrollClass, window.scrollY > 8);
};

onMounted(() => {
  updateScrollClass();
  window.addEventListener("scroll", updateScrollClass, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", updateScrollClass);
  document.documentElement.classList.remove(scrollClass);
});
</script>

<template>
  <div :class="{ 'tolaria-landing-shell': frontmatter.landing }">
    <DefaultTheme.Layout />
  </div>
</template>
