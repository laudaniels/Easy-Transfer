<template lang="pug">
  div.upload-files
    .panel.panel-default(:class="{'panel-primary': !disabled}")
      .panel-heading
        span.pull-right(v-show="bucketSize > 0") {{ humanFileSize(bucketSize) }}
        strong {{ $root.lang.files }}
      .panel-body
        .empty-files-big-plus(
          :style="{cursor: disabled ? 'default' : 'pointer'}",
          v-show="files.length === 0",
          tabindex="0",
          role="button",
          @click="triggerFileInput()",
          @keydown.enter.prevent="triggerFileInput()",
          @keydown.space.prevent="triggerFileInput()"
        )
          a
            icon(name="plus", scale="4")
            br
            |  {{ $root.lang.dropFilesHere }}
          p.text-center.empty-folder-link
            a(
              @click.stop="triggerFolderInput()",
              tabindex="0",
              role="button",
              @keydown.enter.stop.prevent="triggerFolderInput()",
              @keydown.space.stop.prevent="triggerFolderInput()"
            )
              icon.fa-fw(name="folder")
              |  or select a folder

        template(v-if="files.length")
          .folder-tree-pane(v-if="hasFolders")
            div.folder-tree-item(
              :class="{selected: selectedPath === ''}",
              style="padding-left: 10px",
              @click="selectedPath = ''",
              tabindex="0",
              role="button",
              @keydown.enter.prevent="selectedPath = ''",
              @keydown.space.prevent="selectedPath = ''"
            )
              icon.fa-fw(name="home")
              |  Root
            folder-tree(:tree="fileTree", :selected-path="selectedPath", @select="selectedPath = $event")

          table.table.table-striped
            tbody
              tr(v-for="file in currentFiles", :key="fileKey(file)")
                td.file-icon
                  file-icon(:file="file._File")
                td
                  p
                    strong  {{ file.name }}
                    small  ({{ file.humanSize }})
                  p
                    input.form-control.input-sm(type="text", :placeholder="$root.lang.comment", v-model="file.comment", :disabled="disabled")
                  .alert.alert-danger(v-if="file.error")
                    icon.fa-fw(name="exclamation-triangle")
                    |  {{ file.error }}
                  .progress(v-show="!file.error && (state === 'uploading' || state === 'uploaded')")
                    .progress-bar.progress-bar-success.progress-bar-striped(:style="{width: file.progress.percentage+'%'}", :class="{active:!file.uploaded}")
                td.btns
                  a(
                    style="cursor:pointer",
                    @click="$store.dispatch('upload/removeFile', file)",
                    @keydown.enter.prevent="$store.dispatch('upload/removeFile', file)",
                    @keydown.space.prevent="$store.dispatch('upload/removeFile', file)",
                    v-show="!disabled || bucketSizeError",
                    tabindex="0",
                    role="button"
                  )
                    icon(name="times")

        input#fileInput(type="file", @change="$store.dispatch('upload/addFiles', $event.target.files)", multiple="", :disabled="disabled", style="display: none")
        input#folderInput(type="file", webkitdirectory="", directory="", @change="$store.dispatch('upload/addFiles', $event.target.files)", :disabled="disabled", style="display: none")
        .text-right
          a.btn.btn-default.btn-sm(
            @click="triggerFolderInput()",
            @keydown.enter.prevent="triggerFolderInput()",
            @keydown.space.prevent="triggerFolderInput()",
            :disabled="disabled",
            v-show="files.length>0",
            tabindex="0",
            role="button",
            title="Add folder"
          )
            icon(name="folder")
          |
          a.btn.btn-success.btn-sm(
            @click="triggerFileInput()",
            @keydown.enter.prevent="triggerFileInput()",
            @keydown.space.prevent="triggerFileInput()",
            :disabled="disabled",
            v-show="files.length>0",
            tabindex="0",
            role="button"
          )
            icon(name="plus-circle")
</template>


<script type="text/babel">
  import dragDrop from 'drag-drop';
  import 'vue-awesome/icons/exclamation-triangle'
  import 'vue-awesome/icons/plus'
  import 'vue-awesome/icons/plus-circle'
  import 'vue-awesome/icons/times'
  import 'vue-awesome/icons/folder'
  import 'vue-awesome/icons/home'
  import { mapGetters, mapState } from 'vuex';
  import FolderTree from '../common/FolderTree.vue';
  import FileIcon from '../common/FileIcon.vue';
  import { humanFileSize } from "./store/upload";

  export default {
    name: 'Files',

    components: { FolderTree, FileIcon },

    data() {
      return { selectedPath: '' };
    },

    computed: {
      ...mapState('upload', ['files']),
      ...mapState(['state',]),
      ...mapGetters('upload', ['bucketSize', 'bucketSizeError']),
      ...mapGetters(['disabled']),
      fileTree() {
        const root = { folders: {}, files: [] };
        for (const file of this.files) {
          if (!file.relativePath) {
            root.files.push(file);
            continue;
          }
          let node = root;
          for (const segment of file.relativePath.split('/')) {
            if (!node.folders[segment]) node.folders[segment] = { folders: {}, files: [] };
            node = node.folders[segment];
          }
          node.files.push(file);
        }
        return root;
      },
      hasFolders() {
        return Object.keys(this.fileTree.folders).length > 0;
      },
      currentFiles() {
        if (!this.selectedPath) return this.fileTree.files;
        let node = this.fileTree;
        for (const segment of this.selectedPath.split('/')) {
          if (!node.folders[segment]) return [];
          node = node.folders[segment];
        }
        return node.files;
      }
    },

    mounted() {
      // init drop files support on <body>
      this.dragDropCleanup = dragDrop('body', files => this.$store.dispatch('upload/addFiles', files));
    },

    watch: {
      state: function(state) {
        if(state === 'uploading') {
          this.dragDropCleanup();
        }
      }
    },

    methods: {
      humanFileSize,
      fileKey(file) {
        return (file.relativePath || '') + '/' + file.name + '_' + file._File.size + '_' + file._File.lastModified;
      },
      triggerFileInput() {
        if (this.disabled) return;
        const input = document.getElementById('fileInput');
        if (input) input.click();
      },
      triggerFolderInput() {
        if (this.disabled) return;
        const input = document.getElementById('folderInput');
        if (input) input.click();
      },
    }
  };
</script>
