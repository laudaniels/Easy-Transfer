<template lang="pug">
  div
    div(
      v-for="(subtree, folderName) in tree.folders",
      :key="fullPath(folderName)"
    )
      div.folder-tree-item(
        :class="{selected: selectedPath === fullPath(folderName)}",
        :style="{paddingLeft: (depth * 18 + 10) + 'px'}",
        @click="$emit('select', fullPath(folderName))",
        tabindex="0",
        role="button",
        @keydown.enter.prevent="$emit('select', fullPath(folderName))",
        @keydown.space.prevent="$emit('select', fullPath(folderName))"
      )
        icon.fa-fw(name="folder")
        |  {{ folderName }}
      folder-tree(
        :tree="subtree",
        :depth="depth + 1",
        :path-prefix="fullPath(folderName)",
        :selected-path="selectedPath",
        @select="$emit('select', $event)"
      )
</template>

<script type="text/babel">
  import 'vue-awesome/icons/folder';

  export default {
    name: 'FolderTree',

    props: {
      tree: { type: Object, required: true },
      depth: { type: Number, default: 0 },
      pathPrefix: { type: String, default: '' },
      selectedPath: { type: String, default: '' },
    },

    methods: {
      fullPath(folderName) {
        return this.pathPrefix ? this.pathPrefix + '/' + folderName : folderName;
      }
    }
  };
</script>
