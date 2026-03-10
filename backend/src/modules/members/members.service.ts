import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { Tag, TagType } from '../tags/entities/tag.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    const member = this.memberRepository.create(createMemberDto);
    const saved = await this.memberRepository.save(member);

    // Auto-create a 'person' tag for the new member
    await this.ensureMemberTag(saved.name, saved.nameEn);

    return saved;
  }

  async findAll(): Promise<Member[]> {
    return this.memberRepository.find({
      order: { sortOrder: 'ASC' },
    });
  }

  async findAllActive(): Promise<Member[]> {
    return this.memberRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException(`Member with ID "${id}" not found`);
    }
    return member;
  }

  async findWithArticles(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['articles', 'articles.category'],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID "${id}" not found`);
    }
    return member;
  }

  async findBySlug(slug: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { slug },
      relations: ['articles', 'articles.category'],
    });
    if (!member) {
      throw new NotFoundException(`Member with slug "${slug}" not found`);
    }
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    const oldName = member.name;
    Object.assign(member, updateMemberDto);
    const saved = await this.memberRepository.save(member);

    // If name changed, ensure new person tag exists
    if (updateMemberDto.name && updateMemberDto.name !== oldName) {
      await this.ensureMemberTag(saved.name, saved.nameEn);
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepository.remove(member);
  }

  private async ensureMemberTag(nameHe: string, nameEn?: string): Promise<void> {
    const slug = nameHe
      .replace(/[^\w\u0590-\u05FF]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase();

    const existing = await this.tagRepository.findOne({ where: { slug } });
    if (!existing) {
      await this.tagRepository.save(
        this.tagRepository.create({
          nameHe,
          nameEn: nameEn || undefined,
          slug,
          tagType: TagType.PERSON,
        }),
      );
    }
  }
}
